import { collection, query, orderBy, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { supabase } from "./supabase";

/**
 * Subscribes to reports with real-time updates
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export const subscribeToReports = (callback) => {
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
        const reports = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : data.incidentDate || "Unknown",
                evidenceUrls: data.evidenceUrls || {}
            };
        });
        callback(reports);
    }, (error) => {
        console.error("Error subscribing to reports:", error);
    });
};

/**
 * Fetches all reports from Firestore
 * @returns {Promise<Array>} Array of report objects
 */
export const fetchAllReports = async () => {
    try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore timestamp to readable string if it exists
                timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : data.incidentDate || "Unknown",
                // Ensure evidenceUrls exists
                evidenceUrls: data.evidenceUrls || {}
            };
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        throw error;
    }
};

/**
 * Updates the status of a report
 * @param {string} reportId 
 * @param {string} status 
 * @param {string} [rejectionReason]
 * @returns {Promise<void>}
 */
export const updateReportStatus = async (reportId, status, rejectionReason = null) => {
    try {
        const reportRef = doc(db, "reports", reportId);
        const updateData = { status };
        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }
        await updateDoc(reportRef, updateData);
    } catch (error) {
        console.error("Error updating report status:", error);
        throw error;
    }
};

/**
 * Helper to get a clean breakdown list for UI
 * @param {Object} breakdown 
 * @returns {Array} List of {label, value, type}
 */
export const formatTrustBreakdown = (breakdown) => {
    if (!breakdown) return [];

    const labels = {
        mockGps: "GPS Integrity",
        gallerySource: "Source Check",
        noEvidence: "Evidence Quality",
        partialEvidence: "Partial Evidence",
        fullEvidence: "Evidence Bonus",
        descriptionDepth: "Detail Analysis",
        noDate: "Missing Date",
        noTime: "Missing Time",
        staleness: "Report Freshness",
        incompleteAnswers: "Response Rate",
        detailBonus: "Detail Reward",
        invalidLocation: "Location Validity",
        fabricationFlag: "Consistency Check"
    };

    return Object.entries(breakdown)
        .filter(([key]) => key !== 'finalScore')
        .map(([key, value]) => ({
            label: labels[key] || key,
            value: Math.abs(value),
            type: value < 0 ? 'negative' : 'positive'
        }));
};
