<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => [
        'api/*',
        // * The GraphQL endpoint sits outside api/* (Lighthouse owns the route) but is called
        // * by the same cross-origin SPA, so it needs the same credentialed CORS treatment.
        'graphql',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
        'forgot-password',
        'reset-password',
        'email/verification-notification',
    ],

    'allowed_methods' => ['*'],

    // Credentialed CORS: scope to the front-end origin from the environment and
    // fail closed if it is unset. A secondary localhost origin is only allowed
    // in local/testing to support running a second dev instance.
    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'),
        env('APP_ENV') === 'local' || env('APP_ENV') === 'testing' ? 'http://localhost:3001' : null,
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
