<?php
/**
 * Front controller — GET /headless/waveform?sample_id=N
 *                   GET /headless/waveform?id_product=N
 *
 * Generates SoundCloud-grade waveform peaks via:
 *  - Dynamic peak count (~1 peak per 150ms, between 200 and 800)
 *  - RMS (Root Mean Square) per bucket → smoother & more representative
 *  - Track-level normalization (max RMS = 1.0) → consistent visual height
 *
 * Cached to disk : cache/waveforms/{sample_id}.json.
 */
class Pixfeed_headless_apiWaveformModuleFrontController extends ModuleFrontController
{
    const SAMPLE_RATE = 22050;
    const MIN_PEAKS = 200;
    const MAX_PEAKS = 800;
    const SECONDS_PER_PEAK = 0.15;

    public $auth = false;
    public $ssl = true;

    public function initContent()
    {
        $this->jsonResponse($this->buildResponse());
    }
    public function displayAjax()
    {
        $this->jsonResponse($this->buildResponse());
    }

    protected function jsonResponse($payload)
    {
        if (ob_get_level() > 0) @ob_end_clean();
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=86400');
        header('Access-Control-Allow-Origin: *');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    protected function buildResponse()
    {
        $sampleId = (int) Tools::getValue('sample_id', 0);
        $idProduct = (int) Tools::getValue('id_product', 0);

        if ($sampleId > 0) {
            $row = $this->fetchSample($sampleId);
            if (!$row) return ['error' => 'Sample not found', 'sample_id' => $sampleId];
            $data = $this->buildWaveform($row);
            if (!$data) return ['error' => 'Failed to generate waveform', 'sample_id' => $sampleId];
            return $data;
        }
        if ($idProduct > 0) {
            $rows = $this->fetchSamplesByProduct($idProduct);
            $waveforms = [];
            foreach ($rows as $row) {
                $d = $this->buildWaveform($row);
                if ($d) $waveforms[] = $d;
            }
            return ['id_product' => $idProduct, 'count' => count($waveforms), 'waveforms' => $waveforms];
        }
        return ['error' => 'Missing parameter : sample_id or id_product'];
    }

    protected function fetchSample($sampleId)
    {
        return Db::getInstance()->getRow('
            SELECT id_papp, product_id, papp_audio_url, papp_audio_filename, papp_audio_display_filename
            FROM ' . _DB_PREFIX_ . 'papp_audio_playlist
            WHERE id_papp = ' . (int) $sampleId) ?: null;
    }

    protected function fetchSamplesByProduct($idProduct)
    {
        return Db::getInstance()->executeS('
            SELECT id_papp, product_id, papp_audio_url, papp_audio_filename, papp_audio_display_filename
            FROM ' . _DB_PREFIX_ . 'papp_audio_playlist
            WHERE product_id = "' . (int) $idProduct . '"
            ORDER BY id_papp ASC') ?: [];
    }

    protected function buildWaveform($row)
    {
        $sampleId = (int) ($row['id_papp'] ?? 0);
        $idProduct = (int) ($row['product_id'] ?? 0);
        $filename = (string) ($row['papp_audio_filename'] ?? '');
        if (!$filename || !$sampleId) return null;

        $physPath = _PS_MODULE_DIR_ . 'productaudioplaylistplugin/upload/' . $idProduct . '/' . $filename;
        if (!is_file($physPath)) {
            $physPath = _PS_MODULE_DIR_ . 'productaudioplaylistplugin/upload/' . $filename;
            if (!is_file($physPath)) {
                return ['error' => 'mp3 file not found on disk', 'sample_id' => $sampleId];
            }
        }

        $cacheDir = _PS_MODULE_DIR_ . 'pixfeed_headless_api/cache/waveforms/';
        if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
        $cacheFile = $cacheDir . $sampleId . '.json';

        if (is_file($cacheFile) && filemtime($cacheFile) >= filemtime($physPath)) {
            $cached = @json_decode(file_get_contents($cacheFile), true);
            if (is_array($cached) && !empty($cached['peaks']) && ($cached['method'] ?? '') === 'rms-normalized') {
                return $cached;
            }
        }

        $duration = $this->getDuration($physPath);
        $numPeaks = max(self::MIN_PEAKS, min(self::MAX_PEAKS, (int) round($duration / self::SECONDS_PER_PEAK)));

        $peaks = $this->generatePeaks($physPath, $numPeaks);
        if (!$peaks) return null;

        $data = [
            'sample_id' => $sampleId,
            'id_product' => $idProduct,
            'filename' => $filename,
            'title' => (string) ($row['papp_audio_display_filename'] ?? ''),
            'duration' => $duration,
            'num_peaks' => count($peaks),
            'method' => 'rms-normalized',
            'peaks' => $peaks,
        ];

        @file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $data;
    }

    /**
     * Decode mp3 to PCM, compute RMS per bucket, normalize by max RMS.
     */
    protected function generatePeaks($filePath, $numPeaks)
    {
        $cmd = sprintf(
            'ffmpeg -hide_banner -loglevel error -i %s -ac 1 -ar %d -f s16le -',
            escapeshellarg($filePath),
            self::SAMPLE_RATE
        );
        $pcm = @shell_exec($cmd);
        if (!$pcm || strlen($pcm) < 4) return null;

        $samples = unpack('s*', $pcm);
        if (!$samples) return null;
        $total = count($samples);
        if ($total === 0) return null;

        $bucketSize = max(1, (int) floor($total / $numPeaks));

        // Step 1 : compute raw RMS per bucket
        $rms = [];
        for ($i = 0; $i < $numPeaks; $i++) {
            $start = $i * $bucketSize + 1;
            $end = min($start + $bucketSize, $total + 1);
            $count = $end - $start;
            if ($count <= 0) { $rms[] = 0; continue; }
            $sumSq = 0.0;
            for ($j = $start; $j < $end; $j++) {
                $v = $samples[$j];
                $sumSq += $v * $v;
            }
            $rms[] = sqrt($sumSq / $count);
        }

        // Step 2 : normalize by max RMS so the loudest section = 1.0
        $maxRms = max($rms);
        if ($maxRms <= 0) return null;

        $peaks = [];
        foreach ($rms as $r) {
            // Apply soft sqrt curve to bring out quieter sections
            $norm = $r / $maxRms;
            $peaks[] = round(sqrt($norm), 3);
        }
        return $peaks;
    }

    protected function getDuration($filePath)
    {
        $cmd = sprintf(
            'ffprobe -v error -show_entries format=duration -of csv=p=0 %s',
            escapeshellarg($filePath)
        );
        $out = @shell_exec($cmd);
        return $out ? (float) trim($out) : 0.0;
    }
}
