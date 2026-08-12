<?php

namespace App\GraphQL;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Render an API Resource to the exact array the REST API puts on the wire.
 *
 * GraphQL resolvers return this instead of the Eloquent model so that both transports
 * serialize through one contract: the same field names, the same enum backing values, and
 * timestamps already in Laravel's ISO-8601 form. Resolving models directly would hand
 * GraphQL a Role instance and Carbon objects, forcing a second response shape on clients.
 *
 * The round-trip through JSON is deliberate — it is what applies JsonSerializable to the
 * nested values, which toArray() alone leaves as objects.
 */
class ResourcePayload
{
    /**
     * @return array<string, mixed>
     */
    public static function of(JsonResource $resource): array
    {
        /** @var array<string, mixed> */
        return json_decode($resource->toJson(), true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @param  JsonResource  $collection  a resource collection, e.g. UserResource::collection($users)
     * @return list<array<string, mixed>>
     */
    public static function ofMany(JsonResource $collection): array
    {
        /** @var list<array<string, mixed>> */
        return json_decode($collection->toJson(), true, 512, JSON_THROW_ON_ERROR);
    }
}
