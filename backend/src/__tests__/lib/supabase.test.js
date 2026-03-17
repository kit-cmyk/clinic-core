import { createSupabaseAdminClient, createSupabaseAnonClient } from '../../lib/supabase.js';

// Use dummy-but-valid-format values — tests don't hit the network
const TEST_URL = 'https://test-project.supabase.co';
const TEST_SERVICE_KEY = 'test-service-role-key';
const TEST_ANON_KEY = 'test-anon-key';

describe('createSupabaseAdminClient', () => {
  it('returns a client object', () => {
    const client = createSupabaseAdminClient({ url: TEST_URL, key: TEST_SERVICE_KEY });
    expect(client).toBeDefined();
  });

  it('client has auth property', () => {
    const client = createSupabaseAdminClient({ url: TEST_URL, key: TEST_SERVICE_KEY });
    expect(client.auth).toBeDefined();
  });

  it('creates distinct instances on each call', () => {
    const a = createSupabaseAdminClient({ url: TEST_URL, key: TEST_SERVICE_KEY });
    const b = createSupabaseAdminClient({ url: TEST_URL, key: TEST_SERVICE_KEY });
    expect(a).not.toBe(b);
  });
});

describe('createSupabaseAnonClient', () => {
  it('returns a client object', () => {
    const client = createSupabaseAnonClient({ url: TEST_URL, key: TEST_ANON_KEY });
    expect(client).toBeDefined();
  });

  it('client has auth property', () => {
    const client = createSupabaseAnonClient({ url: TEST_URL, key: TEST_ANON_KEY });
    expect(client.auth).toBeDefined();
  });

  it('admin and anon clients are distinct instances', () => {
    const admin = createSupabaseAdminClient({ url: TEST_URL, key: TEST_SERVICE_KEY });
    const anon = createSupabaseAnonClient({ url: TEST_URL, key: TEST_ANON_KEY });
    expect(admin).not.toBe(anon);
  });
});
