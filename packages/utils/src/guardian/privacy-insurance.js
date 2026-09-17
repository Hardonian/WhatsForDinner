// @ts-nocheck
/**
 * Privacy Insurance Features
 * Private Mode Pulse, Sensitive Context Detection, MFA Bubble, Emergency Lockdown
 */
export class PrivacyInsurance {
    middleware;
    state;
    constructor(middleware) {
        this.middleware = middleware;
        this.state = {
            privateModeActive: false,
            sensitiveContextActive: false,
            lockdownActive: false,
            mfaBubbleActive: false,
        };
    }
    /**
     * Private Mode Pulse - Quick toggle to freeze telemetry instantly
     */
    togglePrivateMode() {
        this.state.privateModeActive = !this.state.privateModeActive;
        this.middleware.setEnabled(!this.state.privateModeActive);
        // Log the toggle
    }
    isPrivateModeActive() {
        return this.state.privateModeActive;
    }
    /**
     * Sensitive Context Detection
     * Automatically mutes monitoring when camera/microphone/location is active
     */
    detectSensitiveContext() {
        const context = this.middleware.checkSensitiveContext();
        const wasActive = this.state.sensitiveContextActive;
        this.state.sensitiveContextActive =
            context.cameraActive || context.microphoneActive || context.locationActive;
        if (this.state.sensitiveContextActive && !wasActive) {
            // Automatically mute monitoring
            this.middleware.setEnabled(false);
        }
        else if (!this.state.sensitiveContextActive && wasActive) {
            // Re-enable monitoring if private mode is not active
            if (!this.state.privateModeActive) {
                this.middleware.setEnabled(true);
            }
        }
    }
    /**
     * MFA Bubble - Elevated session expires sooner when Guardian detects risk increase
     */
    activateMFABubble(durationMinutes = 15) {
        this.state.mfaBubbleActive = true;
        this.state.mfaBubbleExpiresAt = new Date();
        this.state.mfaBubbleExpiresAt.setMinutes(this.state.mfaBubbleExpiresAt.getMinutes() + durationMinutes);
    }
    checkMFABubble() {
        if (!this.state.mfaBubbleActive) {
            return { active: false };
        }
        if (this.state.mfaBubbleExpiresAt && new Date() > this.state.mfaBubbleExpiresAt) {
            this.state.mfaBubbleActive = false;
            this.state.mfaBubbleExpiresAt = undefined;
            return { active: false };
        }
        return {
            active: true,
            expiresAt: this.state.mfaBubbleExpiresAt,
        };
    }
    /**
     * Emergency Data Lockdown
     * 1-click killswitch → wipes local telemetry, pauses background sync
     */
    async activateLockdown() {
        this.state.lockdownActive = true;
        this.state.privateModeActive = true;
        this.middleware.setEnabled(false);
        // In a real implementation, this would:
        // 1. Clear local telemetry cache
        // 2. Pause all background sync operations
        // 3. Disable all data collection
        // 4. Notify user
    }
    async deactivateLockdown() {
        this.state.lockdownActive = false;
        // Only re-enable if sensitive context is not active
        if (!this.state.sensitiveContextActive) {
            this.state.privateModeActive = false;
            this.middleware.setEnabled(true);
        }
    }
    isLockdownActive() {
        return this.state.lockdownActive;
    }
    /**
     * Get current privacy state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Adjust MFA bubble duration based on risk level
     */
    adjustMFABubbleForRisk(riskLevel) {
        const durations = {
            low: 30, // 30 minutes for low risk
            medium: 15, // 15 minutes for medium risk
            high: 5, // 5 minutes for high risk
        };
        if (this.state.mfaBubbleActive) {
            // Shorten existing bubble if risk increased
            const newDuration = durations[riskLevel];
            this.activateMFABubble(newDuration);
        }
    }
}
