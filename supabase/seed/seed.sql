-- Usage: run after creating league and commissioner profile/member rows.
with prices as (
  select * from (values
  (1,500,40),(2,420,55),(3,360,70),(4,300,90),(5,250,110),(6,210,130),(7,180,155),(8,150,180),
  (9,125,210),(10,100,245),(11,80,285),(12,65,330),(13,50,380),(14,35,435),(15,20,500),(16,10,600)
  ) as p(seed, base_price, payout)
), slots as (
  select l.id league_id, r.region, s.seed
  from leagues l
  cross join (values ('East'),('West'),('South'),('Midwest')) r(region)
  cross join generate_series(1,16) s(seed)
)
insert into teams (league_id, name, region, seed, base_price, current_price, payout_per_win)
select slots.league_id,
       concat(slots.region, ' ', slots.seed, ' Seed'),
       slots.region,
       slots.seed,
       prices.base_price,
       prices.base_price,
       prices.payout
from slots
join prices on prices.seed = slots.seed
on conflict do nothing;
