<?php

// * Lighthouse's `store` query-cache mode serializes a parsed DocumentNode into the Laravel
// * cache. This project keeps Laravel's hardened `cache.serializable_classes => false`, which
// * makes that value come back as __PHP_Incomplete_Class and 500s every cache hit after the
// * first. The feature suite cannot catch it — tests use the array store and never hit a
// * warm cache — so the incompatible combination is asserted directly.

test('the query cache mode is compatible with the cache serialization policy', function () {
    $allowsUnserialization = config('cache.serializable_classes') !== false;

    expect(config('lighthouse.query_cache.mode') !== 'store' || $allowsUnserialization)
        ->toBeTrue(
            'lighthouse.query_cache.mode "store" needs cache.serializable_classes to permit '
            .'unserializing graphql-php AST nodes; use "opcache" instead.'
        );
});
