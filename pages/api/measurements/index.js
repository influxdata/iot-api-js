import { query, config } from '../../../lib/influxdb';

/**
 * Executes a SQL query against the InfluxDB 3 database and returns results.
 *
 * Note: In InfluxDB 3, use SQL or InfluxQL to query data.
 * This function accepts SQL queries and returns results as CSV-formatted text
 * for backward compatibility with the original API response format.
 *
 * @param {string} sqlQuery - The SQL query to execute
 * @returns {Promise<string>} CSV-formatted query results
 */
export async function getMeasurements(sqlQuery) {
	const database = config.database;
	const rows = await query(sqlQuery, database);

	if (rows.length === 0) {
		return '';
	}

	// Convert results to CSV format for backward compatibility
	const columns = Object.keys(rows[0]);
	const header = columns.join(',');
	const dataRows = rows.map((row) => columns.map((col) => formatCsvValue(row[col])).join(','));

	return [header, ...dataRows].join('\n') + '\n';
}

/**
 * Formats a value for CSV output.
 * @param {any} value - The value to format
 * @returns {string} The formatted CSV value
 */
function formatCsvValue(value) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'string') {
		// Escape quotes and wrap in quotes if contains comma, quote, or newline
		if (value.includes(',') || value.includes('"') || value.includes('\n')) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	return String(value);
}
