<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CAPTCHA Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for CAPTCHA service used in the application.
    |
    */

    'secret_key' => env('CAPTCHA_SECRET_KEY'),

    'site_key' => env('CAPTCHA_SITE_KEY'),

    'enabled' => env('CAPTCHA_ENABLED', true),

];
