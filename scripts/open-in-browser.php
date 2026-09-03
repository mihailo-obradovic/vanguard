<?php

// * Cross-platform "open this file in the default browser", used by composer test:coverage-html.
$target = $argv[1] ?? null;

if ($target === null || ! file_exists($target)) {
    fwrite(STDERR, "open-in-browser: no such file: {$target}\n");
    exit(1);
}

$opener = match (PHP_OS_FAMILY) {
    'Darwin' => 'open',
    'Windows' => 'start ""',
    default => 'xdg-open',
};

exec($opener.' '.escapeshellarg($target));
