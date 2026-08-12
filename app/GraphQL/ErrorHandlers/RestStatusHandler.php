<?php

namespace App\GraphQL\ErrorHandlers;

use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Nuwave\Lighthouse\Exceptions\AuthenticationException;
use Nuwave\Lighthouse\Exceptions\AuthorizationException;
use Nuwave\Lighthouse\Exceptions\ValidationException;
use Nuwave\Lighthouse\Execution\ErrorHandler;

/**
 * Stamp each GraphQL error with the HTTP status the REST API would have returned.
 *
 * GraphQL reports failures as HTTP 200 with an `errors` array, and Lighthouse's own
 * extensions only mark two cases (`validation` and `guards`). Without a third marker the
 * client cannot tell "forbidden" from "something broke", which is the difference between
 * navigating the user away and showing a toast. Rather than have the client match on error
 * message text, the server states the equivalence once, here, as `extensions.status`.
 *
 * Registered last in `lighthouse.error_handlers` so the built-in handlers have already
 * re-wrapped the underlying exception into Lighthouse's own classes by the time this runs.
 */
class RestStatusHandler implements ErrorHandler
{
    public function __invoke(?Error $error, \Closure $next): ?array
    {
        $formatted = $next($error);

        if ($error === null || $formatted === null) {
            return $formatted;
        }

        $status = match (true) {
            $error->getPrevious() instanceof ValidationException => 422,
            $error->getPrevious() instanceof AuthenticationException => 401,
            $error->getPrevious() instanceof AuthorizationException => 403,
            $error->getPrevious() instanceof ModelNotFoundException => 404,
            default => null,
        };

        if ($status !== null) {
            $formatted['extensions']['status'] = $status;
        }

        return $formatted;
    }
}
