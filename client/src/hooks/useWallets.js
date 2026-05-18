import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

export const useWallets = () => {
  const queryClient = useQueryClient();

  const {
    data: wallets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => axios.get('/wallets').then(res => res.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createWallet = useMutation({
    mutationFn: (data) => axios.post('/wallets', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wallets']);
      queryClient.invalidateQueries(['dashboard', 'summary']);
      toast.success('Wallet created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create wallet');
    },
  });

  const updateWallet = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/wallets/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wallets']);
      queryClient.invalidateQueries(['dashboard', 'summary']);
      toast.success('Wallet updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update wallet');
    },
  });

  const deleteWallet = useMutation({
    mutationFn: (id) => axios.delete(`/wallets/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wallets']);
      queryClient.invalidateQueries(['dashboard', 'summary']);
      toast.success('Wallet deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete wallet');
    },
  });

  return {
    wallets,
    isLoading,
    error,
    createWallet,
    updateWallet,
    deleteWallet,
  };
};
