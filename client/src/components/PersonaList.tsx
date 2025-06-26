import useSWR from 'swr';
import TutorCard from './TutorCard';
import type { Persona } from '@/types/personas';

export default function PersonaList() {
  const { data, error, isLoading } = useSWR(
    '/api/personas',
    url => fetch(url).then(res => res.json())
  );

  if (error) return <div>Failed to load tutors</div>;
  if (isLoading) return <div>Loading tutors...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.map((tutor) => (
        <TutorCard
          key={tutor.id}
          name={tutor.name}
          description={tutor.description}
          avatarUrl={tutor.avatar_url}
        />
      ))}
    </div>
  );
}