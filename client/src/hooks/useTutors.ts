
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useTutors() {
  const [tutorsData, setTutorsData] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error('Failed to fetch tutors:', error);
        } else {
          console.log('Tutors fetched successfully:', data);
          setTutorsData(data || []);
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
      } finally {
        setTutorsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return { tutorsData, tutorsLoading };
}
