<?php

function getMedicalDataKey(): string
{
    $configured = getenv('SAFESPACE_MEDICAL_DATA_KEY');
    if ($configured && trim($configured) !== '') {
        return hash('sha256', $configured, true);
    }

    // Fallback for local development only. Override with SAFESPACE_MEDICAL_DATA_KEY in real deployments.
    $fallbackSeed = (getenv('SAFESPACE_DB_NAME') ?: 'safespace')
        . '|'
        . (getenv('SAFESPACE_DB_USER') ?: 'root')
        . '|'
        . (getenv('SAFESPACE_DB_PASS') ?: '');

    return hash('sha256', $fallbackSeed, true);
}

function encryptMedicalValue($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    $plaintext = is_string($value) ? $value : json_encode($value);
    $iv = random_bytes(16);
    $ciphertext = openssl_encrypt(
        $plaintext,
        'AES-256-CBC',
        getMedicalDataKey(),
        OPENSSL_RAW_DATA,
        $iv
    );

    if ($ciphertext === false) {
        throw new Exception('Unable to encrypt medical data');
    }

    return base64_encode($iv . $ciphertext);
}

function decryptMedicalValue($value, bool $decodeJson = false)
{
    if ($value === null || $value === '') {
        return $decodeJson ? [] : '';
    }

    $raw = base64_decode($value, true);
    if ($raw === false || strlen($raw) <= 16) {
        return $decodeJson ? [] : '';
    }

    $iv = substr($raw, 0, 16);
    $ciphertext = substr($raw, 16);
    $plaintext = openssl_decrypt(
        $ciphertext,
        'AES-256-CBC',
        getMedicalDataKey(),
        OPENSSL_RAW_DATA,
        $iv
    );

    if ($plaintext === false) {
        return $decodeJson ? [] : '';
    }

    if ($decodeJson) {
        $decoded = json_decode($plaintext, true);
        return is_array($decoded) ? $decoded : [];
    }

    return $plaintext;
}
