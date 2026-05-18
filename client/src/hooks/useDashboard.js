import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await axios.get('/dashboard/summary');
      return data.data;
    },
  });
};
