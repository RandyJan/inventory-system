<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default LDAP Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the LDAP connections below you wish
    | to use as your default connection for all LDAP operations. Of
    | course you may add as many connections you'd like below.
    |
    */

    'default' => env('LDAP_CONNECTION', 'default'),

    /*
    |--------------------------------------------------------------------------
    | LDAP Connections
    |--------------------------------------------------------------------------
    |
    | Below you may configure each LDAP connection your application requires
    | access to. Be sure to include a valid base DN - otherwise you may
    | not receive any results when performing LDAP search operations.
    |
    */

    'connections' => [

        'default' => [
            'hosts' => [env('LDAP_DEFAULT_HOSTS', '127.0.0.1')],
            'username' => env('LDAP_DEFAULT_USERNAME', 'cn=user,dc=local,dc=com'),
            'password' => env('LDAP_DEFAULT_PASSWORD', 'secret'),
            'port' => env('LDAP_DEFAULT_PORT', 389),
            'base_dn' => env('LDAP_DEFAULT_BASE_DN', 'dc=local,dc=com'),
            'timeout' => env('LDAP_DEFAULT_TIMEOUT', 5),
            // 'use_ssl' => env('LDAP_DEFAULT_SSL', false), ..removed in v4.0
            'use_tls' => env('LDAP_DEFAULT_TLS', false),
            'use_starttls' => env('LDAP_DEFAULT_STARTTLS', false),
            
            /*
            |--------------------------------------------------------------------------
            | Custom LDAP Options
            |--------------------------------------------------------------------------
            |
            | Extra LDAP options you may want to configure.
            |
            */

            'options' => [
                // See: http://php.net/ldap_set_option
                LDAP_OPT_X_TLS_REQUIRE_CERT => env('LDAP_TLS_REQUIRE_CERT', LDAP_OPT_X_TLS_HARD),
                LDAP_OPT_REFERRALS => env('LDAP_OPT_REFERRALS', 0),
                LDAP_OPT_PROTOCOL_VERSION => 3,
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | LDAP Logging
    |--------------------------------------------------------------------------
    |
    | When LDAP logging is enabled, all LDAP search and authentication
    | operations are logged using the default application logging
    | driver. This can assist in debugging issues and more.
    |
    */

    'logging' => env('LDAP_LOGGING', true),

    /*
    |--------------------------------------------------------------------------
    | LDAP Cache
    |--------------------------------------------------------------------------
    |
    | LDAP caching enables the caching of paginated and search results. This
    | is great for larger directories where it can take several seconds to
    | retrieve all users and groups. This may not be suitable for
    | real-time applications that require up-to-date LDAP data.
    |
    */

    'cache' => [
        'enabled' => env('LDAP_CACHE', true),
        'driver' => env('CACHE_DRIVER', 'file'),
    ],

];
