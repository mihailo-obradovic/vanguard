<?php

use App\GraphQL\ErrorHandlers\RestStatusHandler;
use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\ModelNotFoundException;

test('a null error passes through untouched', function () {
    $formatted = ['message' => 'ok'];

    $result = (new RestStatusHandler)(null, fn () => $formatted);

    expect($result)->toBe($formatted);
});

test('an already-discarded error stays discarded', function () {
    $error = new Error('boom');

    expect((new RestStatusHandler)($error, fn () => null))->toBeNull();
});

test('an unmapped error gets no status extension', function () {
    $error = new Error(message: 'boom', previous: new RuntimeException('boom'));

    $result = (new RestStatusHandler)($error, fn () => ['message' => 'boom']);

    expect($result)->not->toHaveKey('extensions');
});

test('a mapped error is stamped with the REST status', function () {
    $error = new Error(message: 'missing', previous: new ModelNotFoundException);

    $result = (new RestStatusHandler)($error, fn () => ['message' => 'missing']);

    expect($result['extensions']['status'])->toBe(404);
});
