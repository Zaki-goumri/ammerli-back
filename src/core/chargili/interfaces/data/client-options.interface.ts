export interface ChargilyClientOptions {
  api_key: string;
  mode?: 'test' | 'live'; // Optional, defaults to false
  version?: string; // Optional, defaults to 'v2'
}
