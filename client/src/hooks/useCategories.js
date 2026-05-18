import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

export const useCategories = () => {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => axios.get('/categories').then(res => res.data.data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const createCategory = useMutation({
    mutationFn: (data) => axios.post('/categories', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => axios.delete(`/categories/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    deleteCategory,
  };
};
