import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface WalletAccount {
    id: string;
    user_id: string;
    label: string;
    account_type: 'generated' | 'imported' | 'legacy';
    stellar_public_key: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

interface WalletContextProps {
    accounts: WalletAccount[];
    activeAccount: WalletAccount | null;
    loading: boolean;
    error: string | null;
    refreshAccounts: () => Promise<void>;
    switchAccount: (accountId: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextProps>({
    accounts: [],
    activeAccount: null,
    loading: true,
    error: null,
    refreshAccounts: async () => {},
    switchAccount: async () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<WalletAccount[]>([]);
    const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refreshAccounts = useCallback(async () => {
        if (!user) {
            setAccounts([]);
            setActiveAccount(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('wallet_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            const fetchedAccounts = data as WalletAccount[] || [];
            setAccounts(fetchedAccounts);

            // Determinar conta ativa: 
            // 1. LocalStorage preference
            // 2. is_active flag no banco
            // 3. Primeira conta do array
            const storedActiveId = localStorage.getItem(`@walletnow:active_account:${user.id}`);
            
            let currentActive = fetchedAccounts.find(a => a.id === storedActiveId) 
                             || fetchedAccounts.find(a => a.is_active) 
                             || fetchedAccounts[0] 
                             || null;

            setActiveAccount(currentActive);
            if (currentActive) {
                localStorage.setItem(`@walletnow:active_account:${user.id}`, currentActive.id);
            }

        } catch (err: any) {
            console.error('[WalletContext] Erro ao buscar contas:', err);
            setError(err.message || 'Falha ao carregar as carteiras.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshAccounts();
    }, [refreshAccounts]);

    const switchAccount = async (accountId: string) => {
        if (!user) return;
        const target = accounts.find(a => a.id === accountId);
        if (target) {
            setActiveAccount(target);
            localStorage.setItem(`@walletnow:active_account:${user.id}`, target.id);
            // Future: update 'is_active' in DB if we want to sync the active state across devices
        }
    };

    return (
        <WalletContext.Provider value={{
            accounts,
            activeAccount,
            loading,
            error,
            refreshAccounts,
            switchAccount
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
