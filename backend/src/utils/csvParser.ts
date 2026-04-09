import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Parse CSV string to JSON array
 */
export const parseCsv = (csvString: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from([csvString]);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Detect if content is CSV or JSON
 */
export const detectFormat = (content: string): 'csv' | 'json' => {
  const trimmed = content.trim();
  
  // Check if starts with [ or { (JSON)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json';
  }
  
  // Check if contains comma-separated headers (CSV)
  const firstLine = trimmed.split('\n')[0];
  if (firstLine && firstLine.includes(',')) {
    return 'csv';
  }
  
  return 'json'; // Default to JSON
};

/**
 * Parse CSV or JSON string to array
 */
export const parseDataFile = async (content: string): Promise<any[]> => {
  const format = detectFormat(content);
  
  if (format === 'csv') {
    return await parseCsv(content);
  }
  
  // Parse JSON
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [parsed];
};
