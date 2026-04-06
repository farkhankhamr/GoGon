/**
 * Google Sheets Export Utility
 * Exports daily summaries to a configured Google Sheet.
 * Uses Service Account authentication for server-to-server communication.
 */

const { google } = require('googleapis');

// Configuration from environment
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

/**
 * Get authenticated Google Sheets API client
 */
async function getAuthenticatedClient() {
    if (!SERVICE_ACCOUNT_JSON) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
    }

    let credentials;
    try {
        // Handle base64-encoded JSON
        if (SERVICE_ACCOUNT_JSON.startsWith('{')) {
            credentials = JSON.parse(SERVICE_ACCOUNT_JSON);
        } else {
            credentials = JSON.parse(Buffer.from(SERVICE_ACCOUNT_JSON, 'base64').toString());
        }
    } catch (e) {
        throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return google.sheets({ version: 'v4', auth });
}

/**
 * Export a daily summary to Google Sheets
 * @param {object} summary - DailySummary document
 */
async function exportSummaryToSheets(summary) {
    if (!SHEETS_ID) {
        throw new Error('GOOGLE_SHEETS_ID not configured');
    }

    const sheets = await getAuthenticatedClient();

    // Format data for sheet row
    const row = [
        summary.day_index,
        summary.dateKey,
        summary.totals.total_posts,
        summary.totals.unique_posters,
        JSON.stringify(summary.sentiment),
        JSON.stringify(summary.topics),
        summary.totals.total_reactions,
        summary.totals.total_comments,
        summary.totals.engagement_rate,
        JSON.stringify(summary.gender_dist),
        JSON.stringify(summary.location_dist),
        summary.generatedAt.toISOString(),
        'success'
    ];

    // Check if row for this dateKey already exists
    const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'A:B' // Check day_index and dateKey columns
    });

    const existingRows = existingData.data.values || [];
    const existingRowIndex = existingRows.findIndex(r => r[1] === summary.dateKey);

    if (existingRowIndex >= 0) {
        // Update existing row
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: `A${existingRowIndex + 1}:M${existingRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [row] }
        });
        console.log(`[Sheets] Updated row for ${summary.dateKey}`);
    } else {
        // Append new row
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEETS_ID,
            range: 'A:M',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [row] }
        });
        console.log(`[Sheets] Appended row for ${summary.dateKey}`);
    }

    return true;
}

/**
 * Initialize sheet with headers if empty
 */
async function initSheetHeaders() {
    if (!SHEETS_ID) {
        throw new Error('GOOGLE_SHEETS_ID not configured');
    }

    const sheets = await getAuthenticatedClient();

    const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'A1:M1'
    });

    if (!existingData.data.values || existingData.data.values.length === 0) {
        const headers = [
            'day_index',
            'dateKey',
            'total_posts',
            'unique_posters',
            'sentiment_json',
            'topics_json',
            'total_reactions',
            'total_comments',
            'engagement_rate',
            'gender_json',
            'location_json',
            'generatedAt',
            'export_status'
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: 'A1:M1',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [headers] }
        });

        console.log('[Sheets] Initialized headers');
    }

    return true;
}

module.exports = {
    exportSummaryToSheets,
    initSheetHeaders,
    getAuthenticatedClient
};
