-- Optional: seed 2025 contest + one example team.
-- Run after schema.sql and universities.sql (so RUET exists).

insert into public.contests (year, intro_text, problem_a_note, problem_b_note, source_url)
values (
  2025,
  '**841** teams submitted papers. **131** teams selected Problem A (Acoustic Preservation of the Electric Sasando). **710** teams selected Problem B (Artillery).',
  'No gold medal listed from Bangladeshi team.',
  'Team 496 – Rajshahi University of Engineering and Technology (Rudro Karmokar, Sanjeeda Islam Mou; Sponsor: Md. Faruk Hossain) earned the Gold Medal Award.',
  'https://www.uphysicsc.com/2025_UPC_Results.pdf'
)
on conflict (year) do nothing;

-- One example team (add more via admin)
insert into public.contest_teams (contest_id, team_number, university_id, members_text, sponsor, problem, medal)
select c.id, 496, u.id, 'Rudro Karmokar, Sanjeeda Islam Mou', 'Md. Faruk Hossain', 'B', 'Gold'
from public.contests c
cross join public.universities u
where c.year = 2025 and u.slug = 'ruet'
on conflict (contest_id, team_number) do update set
  university_id = excluded.university_id,
  members_text = excluded.members_text,
  sponsor = excluded.sponsor,
  problem = excluded.problem,
  medal = excluded.medal;
