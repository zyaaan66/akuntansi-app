<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_redirects_to_dashboard(): void
    {
        $this->get(route('home'))->assertRedirect(route('dashboard'));
    }

    public function test_guest_who_opens_home_ends_up_at_login(): void
    {
        $this->followingRedirects()
            ->get(route('home'))
            ->assertOk();

        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }
}
