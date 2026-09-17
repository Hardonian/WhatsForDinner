// @ts-nocheck
/**
 * Trust Fabric AI Layer
 * Learns user comfort zones and adapts recommendations
 */
const fs = (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) ? (() => { try {
    return eval('require')('fs');
}
catch {
    return null;
} })() : null;
const path = (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) ? (() => { try {
    return eval('require')('path');
}
catch {
    return null;
} })() : null;
import { createComponentLogger } from '../logger';
const logger = createComponentLogger('trust-fabric-ts');
export class TrustFabricAI {
    modelPath;
    model = null;
    constructor(userId, modelsDir = './guardian/models') {
        this.modelPath = path.join(modelsDir, `${userId}_trust_fabric.json`);
        this.loadModel();
    }
    loadModel() {
        try {
            if (fs.existsSync(this.modelPath)) {
                const content = fs.readFileSync(this.modelPath, 'utf-8');
                this.model = JSON.parse(content);
            }
            else {
                this.model = this.createDefaultModel();
            }
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                logger.warn('Failed to load Trust Fabric model:', { error });
            }
            this.model = this.createDefaultModel();
        }
    }
    createDefaultModel() {
        return {
            userId: '',
            comfortZones: {},
            privacyModeToggles: 0,
            averageTrustResponses: {
                allow: 0,
                mask: 0,
                redact: 0,
                block: 0,
                alert: 0,
            },
            learnedPreferences: {
                alwaysAllows: [],
                alwaysBlocks: [],
                frequentlyModified: [],
            },
            lastUpdated: new Date().toISOString(),
        };
    }
    /**
     * Learn from user behavior
     */
    learnFromBehavior(behavior) {
        if (!this.model) {
            this.model = this.createDefaultModel();
        }
        const { dataClass, action, userDecision } = behavior;
        // Update comfort zones
        if (!this.model.comfortZones[dataClass]) {
            this.model.comfortZones[dataClass] = {
                averageTrust: 50,
                preferredAction: action,
                disabledSignals: [],
            };
        }
        const zone = this.model.comfortZones[dataClass];
        // Adjust trust based on user decision
        if (userDecision === 'allow') {
            zone.averageTrust = Math.min(100, zone.averageTrust + 5);
        }
        else if (userDecision === 'deny') {
            zone.averageTrust = Math.max(0, zone.averageTrust - 10);
            if (!this.model.learnedPreferences.alwaysBlocks.includes(dataClass)) {
                this.model.learnedPreferences.alwaysBlocks.push(dataClass);
            }
        }
        else if (userDecision === 'modify') {
            // User modified settings - remember this preference
            zone.preferredAction = action;
            if (!this.model.learnedPreferences.frequentlyModified.includes(dataClass)) {
                this.model.learnedPreferences.frequentlyModified.push(dataClass);
            }
        }
        // Update average trust responses
        this.model.averageTrustResponses[action] =
            (this.model.averageTrustResponses[action] || 0) + 1;
        // Update alwaysAllows if user consistently allows
        if (userDecision === 'allow' && zone.averageTrust > 80) {
            if (!this.model.learnedPreferences.alwaysAllows.includes(dataClass)) {
                this.model.learnedPreferences.alwaysAllows.push(dataClass);
            }
        }
        this.model.lastUpdated = new Date().toISOString();
        this.saveModel();
    }
    /**
     * Record privacy mode toggle
     */
    recordPrivacyToggle() {
        if (!this.model) {
            this.model = this.createDefaultModel();
        }
        this.model.privacyModeToggles = (this.model.privacyModeToggles || 0) + 1;
        this.saveModel();
    }
    /**
     * Get adaptive recommendations
     */
    getRecommendations() {
        if (!this.model) {
            return { tighten: [], loosen: [], rationale: 'No model data available' };
        }
        const tighten = [];
        const loosen = [];
        // Analyze comfort zones
        for (const [dataClass, zone] of Object.entries(this.model.comfortZones)) {
            if (zone.averageTrust < 30) {
                tighten.push(dataClass);
            }
            else if (zone.averageTrust > 80) {
                loosen.push(dataClass);
            }
        }
        // Analyze toggle frequency
        if (this.model.privacyModeToggles > 10) {
            // User frequently toggles - suggest tighter defaults
            tighten.push(...this.model.learnedPreferences.frequentlyModified);
        }
        let rationale = '';
        if (tighten.length > 0) {
            rationale += `Consider tightening privacy settings for: ${tighten.join(', ')}. `;
        }
        if (loosen.length > 0) {
            rationale += `Your comfort level suggests you can relax settings for: ${loosen.join(', ')}.`;
        }
        if (!rationale) {
            rationale = 'Your current privacy settings align well with your usage patterns.';
        }
        return { tighten, loosen, rationale };
    }
    /**
     * Get predicted action for data class
     */
    getPredictedAction(dataClass) {
        if (!this.model) {
            return 'allow';
        }
        const zone = this.model.comfortZones[dataClass];
        if (zone) {
            return zone.preferredAction;
        }
        // Check learned preferences
        if (this.model.learnedPreferences.alwaysBlocks.includes(dataClass)) {
            return 'block';
        }
        if (this.model.learnedPreferences.alwaysAllows.includes(dataClass)) {
            return 'allow';
        }
        return 'allow'; // Default
    }
    /**
     * Export Trust Fabric model
     */
    exportModel() {
        if (!this.model) {
            return this.createDefaultModel();
        }
        return { ...this.model };
    }
    /**
     * Import Trust Fabric model
     */
    importModel(model) {
        this.model = model;
        this.saveModel();
    }
    saveModel() {
        if (!this.model) {
            return;
        }
        try {
            const dir = path.dirname(this.modelPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.modelPath, JSON.stringify(this.model, null, 2), 'utf-8');
        }
        catch (error) {
            // Error handled: Failed to save Trust Fabric model:
        }
    }
}
