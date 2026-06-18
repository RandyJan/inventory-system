<?php

namespace App\Http\Controllers;

use App\Notifications\UserRoleChanged;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $service
    ) {}

    // Bell dropdown (latest 10)
    public function latest(Request $request)
    {
        return response()->json(
            $this->service->latest($request->user())
        );
    }

    public function index(Request $request): Response
    {
        return Inertia::render('notifications/index', [
            'notifications' => $this->service->all($request->user()),
        ]);
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    public function read(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return back();
    }

    /**
     * Send a test notification for debugging real-time updates
     */
    public function sendTestNotification(Request $request)
    {
        $user = $request->user();

        try {
            // Send a test role change notification
            $user->notify(new UserRoleChanged(
                $user,
                $user,
                $user->roles->first()?->name ?? 'No previous role',
                $user->roles->first()?->name ?? 'Test Role'
            ));

            return response()->json([
                'success' => true,
                'message' => 'Test notification sent successfully',
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
