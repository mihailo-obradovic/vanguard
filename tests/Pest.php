<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature tests boot the full application and refresh the database between
| tests. Unit tests keep Pest's lightweight default (plain PHPUnit test case).
|
*/

uses(TestCase::class, RefreshDatabase::class)->in('Feature');
