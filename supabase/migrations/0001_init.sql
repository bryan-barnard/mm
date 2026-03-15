-- enums
create type app_role as enum ('commissioner', 'player');
create type league_status as enum ('draft', 'active', 'completed');
create type tournament_round as enum ('ROUND_OF_64', 'ROUND_OF_32', 'SWEET_16', 'ELITE_8', 'FINAL_FOUR', 'CHAMPIONSHIP');
create type transaction_type as enum ('BUY', 'SELL', 'PAYOUT', 'ELIMINATION', 'ROUND_ADVANCE', 'RESET', 'ADMIN_ADJUSTMENT');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role app_role not null default 'player',
  created_at timestamptz not null default now()
);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id),
  current_round tournament_round not null default 'ROUND_OF_64',
  trading_open boolean not null default false,
  status league_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  region text not null,
  seed int not null check (seed between 1 and 16),
  base_price numeric(10,2) not null,
  current_price numeric(10,2) not null,
  payout_per_win numeric(10,2) not null,
  alive boolean not null default true,
  wins int not null default 0,
  eliminated_round tournament_round,
  owner_user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, region, seed)
);

create table player_balances (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  bank_balance numeric(12,2) not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid references teams(id),
  type transaction_type not null,
  amount numeric(12,2) not null,
  round tournament_round,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table game_results (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  winning_team_id uuid not null references teams(id),
  losing_team_id uuid not null references teams(id),
  round tournament_round not null,
  processed_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_teams_league on teams(league_id);
create index idx_teams_owner on teams(owner_user_id);
create index idx_balances_user on player_balances(user_id);
create index idx_txn_league_created on transactions(league_id, created_at desc);
create index idx_txn_user on transactions(user_id);
create index idx_results_league on game_results(league_id);

create function is_league_member(p_league_id uuid, p_user_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from league_members where league_id = p_league_id and user_id = p_user_id);
$$;

create function is_commissioner_of_league(p_league_id uuid, p_user_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from leagues where id = p_league_id and created_by = p_user_id);
$$;

alter table profiles enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table teams enable row level security;
alter table player_balances enable row level security;
alter table transactions enable row level security;
alter table game_results enable row level security;

create policy "profiles self read" on profiles for select using (id = auth.uid());
create policy "profiles self update" on profiles for update using (id = auth.uid());

create policy "leagues member read" on leagues for select using (is_league_member(id, auth.uid()));
create policy "members read" on league_members for select using (is_league_member(league_id, auth.uid()));
create policy "teams member read" on teams for select using (is_league_member(league_id, auth.uid()));
create policy "balances self read" on player_balances for select using (user_id = auth.uid() and is_league_member(league_id, auth.uid()));
create policy "balances self update" on player_balances for update using (false) with check (false);
create policy "txns member read" on transactions for select using (is_league_member(league_id, auth.uid()));
create policy "results member read" on game_results for select using (is_league_member(league_id, auth.uid()));

create or replace function buy_team(p_league_id uuid, p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price numeric(12,2);
  v_owner uuid;
  v_alive boolean;
  v_trading_open boolean;
  v_balance numeric(12,2);
  v_round tournament_round;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;

  select trading_open, current_round into v_trading_open, v_round from leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not is_league_member(p_league_id, v_user) then raise exception 'Not a member'; end if;
  if not v_trading_open then raise exception 'Trading is closed'; end if;

  select current_price, owner_user_id, alive into v_price, v_owner, v_alive from teams where id = p_team_id and league_id = p_league_id for update;
  if not found then raise exception 'Team not found'; end if;
  if not v_alive then raise exception 'Team eliminated'; end if;
  if v_owner is not null then raise exception 'Team already owned'; end if;

  select bank_balance into v_balance from player_balances where league_id = p_league_id and user_id = v_user for update;
  if v_balance < v_price then raise exception 'Insufficient funds'; end if;

  update player_balances set bank_balance = bank_balance - v_price, updated_at = now() where league_id = p_league_id and user_id = v_user;
  update teams set owner_user_id = v_user, updated_at = now() where id = p_team_id;
  insert into transactions(league_id, user_id, team_id, type, amount, round, metadata)
  values (p_league_id, v_user, p_team_id, 'BUY', v_price, v_round, jsonb_build_object('action','buy'));
end;
$$;

grant execute on function buy_team(uuid, uuid) to authenticated;

create or replace function sell_team(p_league_id uuid, p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price numeric(12,2);
  v_owner uuid;
  v_alive boolean;
  v_trading_open boolean;
  v_round tournament_round;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;

  select trading_open, current_round into v_trading_open, v_round from leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not is_league_member(p_league_id, v_user) then raise exception 'Not a member'; end if;
  if not v_trading_open then raise exception 'Trading is closed'; end if;

  select current_price, owner_user_id, alive into v_price, v_owner, v_alive from teams where id = p_team_id and league_id = p_league_id for update;
  if not found then raise exception 'Team not found'; end if;
  if not v_alive then raise exception 'Team eliminated'; end if;
  if v_owner != v_user then raise exception 'Not owner'; end if;

  update player_balances set bank_balance = bank_balance + v_price, updated_at = now() where league_id = p_league_id and user_id = v_user;
  update teams set owner_user_id = null, updated_at = now() where id = p_team_id;
  insert into transactions(league_id, user_id, team_id, type, amount, round, metadata)
  values (p_league_id, v_user, p_team_id, 'SELL', v_price, v_round, jsonb_build_object('action','sell'));
end;
$$;

grant execute on function sell_team(uuid, uuid) to authenticated;

create or replace function price_multiplier(p_round tournament_round)
returns numeric language sql immutable as $$
  select case p_round
    when 'ROUND_OF_64' then 1.2
    when 'ROUND_OF_32' then 1.25
    when 'SWEET_16' then 1.3
    when 'ELITE_8' then 1.4
    when 'FINAL_FOUR' then 1.5
    when 'CHAMPIONSHIP' then 1.75
  end;
$$;

create or replace function record_game_result(p_league_id uuid, p_winning_team_id uuid, p_losing_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_round tournament_round;
  v_w_owner uuid;
  v_payout numeric(12,2);
  v_mult numeric(12,2);
  v_w_alive boolean;
  v_l_alive boolean;
begin
  if not is_commissioner_of_league(p_league_id, v_user) then raise exception 'Commissioner only'; end if;

  select current_round into v_round from leagues where id = p_league_id for update;
  select owner_user_id, payout_per_win, alive into v_w_owner, v_payout, v_w_alive from teams where id = p_winning_team_id and league_id = p_league_id for update;
  select alive into v_l_alive from teams where id = p_losing_team_id and league_id = p_league_id for update;

  if not v_w_alive or not v_l_alive then raise exception 'Both teams must be alive'; end if;

  v_mult := price_multiplier(v_round);

  update teams set wins = wins + 1, current_price = round(current_price * v_mult, 2), updated_at = now() where id = p_winning_team_id;
  update teams set alive = false, current_price = 0, owner_user_id = null, eliminated_round = v_round, updated_at = now() where id = p_losing_team_id;

  if v_w_owner is not null then
    update player_balances set bank_balance = bank_balance + v_payout, updated_at = now()
    where league_id = p_league_id and user_id = v_w_owner;

    insert into transactions(league_id, user_id, team_id, type, amount, round, metadata)
    values (p_league_id, v_w_owner, p_winning_team_id, 'PAYOUT', v_payout, v_round, jsonb_build_object('reason','win'));
  end if;

  insert into transactions(league_id, user_id, team_id, type, amount, round, metadata)
  values (p_league_id, v_user, p_losing_team_id, 'ELIMINATION', 0, v_round, jsonb_build_object('winner', p_winning_team_id));

  insert into game_results(league_id, winning_team_id, losing_team_id, round, processed_by)
  values (p_league_id, p_winning_team_id, p_losing_team_id, v_round, v_user);
end;
$$;

grant execute on function record_game_result(uuid, uuid, uuid) to authenticated;

create or replace function advance_round(p_league_id uuid)
returns tournament_round
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_current tournament_round;
  v_next tournament_round;
begin
  if not is_commissioner_of_league(p_league_id, v_user) then raise exception 'Commissioner only'; end if;
  select current_round into v_current from leagues where id = p_league_id for update;

  v_next := case v_current
    when 'ROUND_OF_64' then 'ROUND_OF_32'
    when 'ROUND_OF_32' then 'SWEET_16'
    when 'SWEET_16' then 'ELITE_8'
    when 'ELITE_8' then 'FINAL_FOUR'
    when 'FINAL_FOUR' then 'CHAMPIONSHIP'
    else null
  end;

  if v_next is null then raise exception 'Tournament complete'; end if;

  update leagues set current_round = v_next, trading_open = true where id = p_league_id;
  insert into transactions(league_id, user_id, type, amount, round, metadata)
  values (p_league_id, v_user, 'ROUND_ADVANCE', 0, v_next, jsonb_build_object('from', v_current, 'to', v_next));

  return v_next;
end;
$$;

grant execute on function advance_round(uuid) to authenticated;

create or replace function set_trading_window(p_league_id uuid, p_open boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_commissioner_of_league(p_league_id, auth.uid()) then raise exception 'Commissioner only'; end if;
  update leagues set trading_open = p_open where id = p_league_id;
end;
$$;
grant execute on function set_trading_window(uuid, boolean) to authenticated;

create or replace function reset_league(p_league_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_commissioner_of_league(p_league_id, auth.uid()) then raise exception 'Commissioner only'; end if;
  update leagues set current_round = 'ROUND_OF_64', trading_open = false, status = 'draft' where id = p_league_id;
  update teams set alive = true, wins = 0, eliminated_round = null, owner_user_id = null, current_price = base_price where league_id = p_league_id;
  update player_balances set bank_balance = 1000 where league_id = p_league_id;
  insert into transactions(league_id, user_id, type, amount, metadata) values (p_league_id, auth.uid(), 'RESET', 0, '{}'::jsonb);
end;
$$;
grant execute on function reset_league(uuid) to authenticated;

create or replace function league_leaderboard(p_league_id uuid)
returns table(user_id uuid, display_name text, bank_balance numeric, portfolio_value numeric, net_worth numeric, holdings_count bigint)
language sql security definer set search_path = public as $$
  select pb.user_id,
         p.display_name,
         pb.bank_balance,
         coalesce(sum(case when t.alive then t.current_price else 0 end), 0) as portfolio_value,
         pb.bank_balance + coalesce(sum(case when t.alive then t.current_price else 0 end), 0) as net_worth,
         count(t.id) filter (where t.alive) as holdings_count
  from player_balances pb
  join profiles p on p.id = pb.user_id
  left join teams t on t.league_id = pb.league_id and t.owner_user_id = pb.user_id
  where pb.league_id = p_league_id
  group by pb.user_id, p.display_name, pb.bank_balance
  order by net_worth desc;
$$;
grant execute on function league_leaderboard(uuid) to authenticated;
