begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

set local role content_rpc_owner;

insert into private.site_releases(
  id, sequence, expected_predecessor_id, manifest_object_key,
  manifest_byte_length, manifest_sha256, content_root_sha256,
  schema_version, taxonomy_version, serializer_version,
  search_contract_version, source_contract_version,
  structured_cutover_date, no_report_days
)
select
  ('60000000-0000-4000-8000-00000000000' || n)::uuid, 9000 + n, null,
  'site-manifests/sha256/' || repeat(n::text, 64) || '.json',
  100, repeat(n::text, 64), repeat('c', 64), 1, 1,
  'daily-json-c14n-v1', 'search-v1', 'daily-source-v1', '2026-07-16', '{}'
from generate_series(0, 2) as n;

insert into private.content_outbox(
  site_release_id, dispatch_id, payload, status, attempts, last_error, dead_lettered_at
) values
  -- Exhausted retries for a release older than the current one.
  ('60000000-0000-4000-8000-000000000000', '61000000-0000-4000-8000-000000000001',
   '{"mode":"production"}', 'dead_letter', 8, 'workflow_failed', clock_timestamp()),
  -- Manually terminalized dispatch of the release that is now current.
  ('60000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000002',
   '{"mode":"production"}', 'dead_letter', 5, 'superseded_by_main_' || repeat('a', 40), clock_timestamp()),
  -- History bootstrap supersession stays resolved evidence.
  ('60000000-0000-4000-8000-000000000000', '61000000-0000-4000-8000-000000000003',
   '{"mode":"production"}', 'dead_letter', 0, 'superseded_by_history_bootstrap', clock_timestamp()),
  -- A newer release that never shipped is still actionable.
  ('60000000-0000-4000-8000-000000000002', '61000000-0000-4000-8000-000000000004',
   '{"mode":"production"}', 'dead_letter', 8, 'workflow_failed', clock_timestamp());

select is(
  (private.get_deployer_alert_state_v1() ->> 'dead_letter_count')::integer,
  3,
  'without a current release every unresolved dead letter is actionable'
);
select is(
  (private.get_deployer_alert_state_v1() ->> 'superseded_dead_letter_count')::integer,
  0,
  'without a current release no dead letter is superseded'
);

insert into private.release_artifacts(
  site_release_id, object_key, byte_length, artifact_sha256,
  artifact_fingerprint_sha256, hash_algorithm, code_sha,
  build_environment_version, production_verified_at
) values (
  '60000000-0000-4000-8000-000000000001',
  'artifacts/sha256/' || repeat('d', 64) || '.json',
  100, repeat('d', 64), repeat('e', 64),
  'sha256-content-addressed-pages-v1', repeat('3', 40),
  'node22.17-astro7-hugo0.147.9-v1', clock_timestamp()
);
insert into private.release_current_pointer(
  singleton, target_site_release_id, target_release_sequence, generation,
  pages_deployment_id, manifest_sha256, artifact_sha256,
  build_environment_version
) values (
  true, '60000000-0000-4000-8000-000000000001', 9001, 1,
  'current-pages-deployment', repeat('1', 64), repeat('d', 64),
  'node22.17-astro7-hugo0.147.9-v1'
);

select is(
  (private.get_deployer_alert_state_v1() ->> 'dead_letter_count')::integer,
  1,
  'only the dead letter newer than the current release is actionable'
);
select is(
  (private.get_deployer_alert_state_v1() ->> 'superseded_dead_letter_count')::integer,
  2,
  'dead letters at or behind the current release are superseded'
);
select is(
  (private.get_deployer_alert_state_v1() ->> 'resolved_dead_letter_count')::integer,
  1,
  'history bootstrap supersessions remain counted as resolved'
);
select ok(
  has_function_privilege('content_deployer', 'private.get_deployer_alert_state_v1()', 'execute'),
  'deployer keeps execute on the alert state after the replacement'
);

select * from finish();
rollback;
