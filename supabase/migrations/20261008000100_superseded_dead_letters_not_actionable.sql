begin;

set local role content_rpc_owner;

-- A dead-lettered outbox row is only actionable while its release could still
-- ship. Once the current pointer has reached a release at or beyond its
-- sequence, a newer release has already superseded it and retrying would only
-- rebuild older content. Count those rows separately instead of alerting on
-- them forever.
create or replace function private.get_deployer_alert_state_v1()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'dead_letter_count', count(*) filter (
      where outbox.status = 'dead_letter'
        and outbox.last_error is distinct from 'superseded_by_history_bootstrap'
        and not coalesce(release.sequence <= pointer.target_release_sequence, false)
    ),
    'resolved_dead_letter_count', count(*) filter (
      where outbox.status = 'dead_letter'
        and outbox.last_error = 'superseded_by_history_bootstrap'
    ),
    'superseded_dead_letter_count', count(*) filter (
      where outbox.status = 'dead_letter'
        and outbox.last_error is distinct from 'superseded_by_history_bootstrap'
        and release.sequence <= pointer.target_release_sequence
    ),
    'stale_queued_count', count(*) filter (
      where (
        outbox.status in ('queued','failed','claimed','dispatched','building','promoting')
        and outbox.inserted_at <= current_timestamp - interval '10 minutes'
      )
      or (
        outbox.status = 'preview_verified'
        and outbox.payload ->> 'mode' = 'production'
        and outbox.updated_at <= current_timestamp - interval '10 minutes'
      )
    ),
    'oldest_actionable_at', min(outbox.inserted_at) filter (
      where outbox.status in ('queued','failed','claimed','dispatched','building','promoting')
        or (
          outbox.status = 'preview_verified'
          and outbox.payload ->> 'mode' = 'production'
        )
    ),
    'release_head_stale_count', (
      select count(*)
      from private.release_head_claims claim
      where claim.inserted_at <= current_timestamp - interval '10 minutes'
        or claim.expires_at <= current_timestamp
    ),
    'oldest_release_head_claimed_at', (
      select min(claim.inserted_at)
      from private.release_head_claims claim
    )
  )
  from private.content_outbox outbox
  join private.site_releases release on release.id = outbox.site_release_id
  left join private.release_current_pointer pointer on pointer.singleton
$$;

comment on function private.get_deployer_alert_state_v1() is
  'Returns actionable outbox and release-head health; dead letters at or behind the current release are superseded, not actionable.';

commit;
