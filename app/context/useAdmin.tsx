'use client'

import React from 'react';
import { ReactNode, createContext, useContext, useState } from 'react';
import { AIConfigType, MessageHistory, MessageInstance, UserCollection } from '../types/types';
import { signOut } from 'next-auth/react';

interface AdminContextType {
  users: UserCollection,
  upvotedList: MessageInstance[],
  downvotedList: MessageInstance[],
  unvotedList: MessageInstance[],
  config?: AIConfigType,
  addUser: (username: string, password: string, role: string) => void;
  loadUsers: () => void;
  deleteUser: (user: string) => void;
  updatePassword: (username: string, password: string) => void;
  updateRole: (username: string, role: string) => void;
  getAIConfig: () => void;
  updateAIConfig: (newConfig: AIConfigType) => void;
  getVotedOn: () => {};
  getThread: (threadID: string) => Promise<MessageHistory[]>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }:AdminProviderProps) => { 
  const [ users, setUsers ] = useState<UserCollection>({ users: [] });
  const [ upvotedList, setUpvotedList ] = useState<Array<MessageInstance>>([]);
  const [ downvotedList, setDownvotedList ] = useState<Array<MessageInstance>>([]);
  const [ unvotedList, setUnvotedList ] = useState<Array<MessageInstance>>([]);
  const [ config, setConfig ] = useState<AIConfigType>();



  const addUser = async (username: string, password: string, role: string) => {
    try {
        const response = await fetch('/api/addUser', {
          method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password, role}),
        });
  
        if(!response.ok){
          await handleResponseError(response);
        }
      } catch (error: any) {
        console.error(`Could not add user`);
        throw new Error(error.message);
      }
    loadUsers();
  }

  const loadUsers = async () => {
    try {
      const responseString = await fetch('/api/loadUsers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response: UserCollection = await responseString.json();
      setUsers(response);
    } catch (error: any) {
        console.error(`Could not get users`);
        throw new Error(error.message);
    }
  };

  const deleteUser = async (user: string) => {
    try {
        await fetch('/api/deleteUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({user}),
        });
      } catch (error: any) {
          console.error(`Could not delete user`);
          throw new Error(error.message);
      }
      loadUsers();
  }

  const updatePassword = async (username: string, password: string) => {
    try {
        await fetch('/api/updateUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username, password}),
        });
      } catch (error: any) {
          console.error(`Could not update user`);
          throw new Error(error.message);
      }
  }

  const updateRole = async (username: string, role: string) => {
    try {
        await fetch('/api/updateUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username, role}),
        });
      } catch (error: any) {
          console.error(`Could not update user`);
          throw new Error(error.message);
    }
    loadUsers();
  }

  const getAIConfig =async () => {
    try {
      const responseString = await fetch('/api/getAIConfig', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const response = await responseString.json();
      const config: AIConfigType = response.config;
      setConfig(config);
    } catch (error: any) {
        console.error(`Could not get config`);
        throw new Error(error.message);
  }
  }

  const updateAIConfig = async (newConfig: AIConfigType) => {
    try {
      await fetch('/api/setAIConfig', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({newConfig}),
      });
    } catch (error: any) {
        console.error(`Could not update config`);
        throw new Error(error.message);
    }
  }

  const getVotedOn = async () => {
    try {
      const responseString = await fetch('/api/getVotedOn', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await responseString.json();
      setUpvotedList(response.upvoted);
      setDownvotedList(response.downvoted);
      setUnvotedList(response.unvoted);
    } catch (error: any) {
        console.error(`Could not get users`);
        throw new Error(error.message);
    }
  }

  const getThread = async(threadID: string): Promise<MessageHistory[]> => {
    try {
      const responseString = await fetch('/api/loadThread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({threadID})
      });
      const response: MessageHistory[] = await responseString.json();
      return response;
    } catch (error: any) {
        console.error(`Could not get users`);
        throw new Error(error.message);
    }
  }
  
  const handleResponseError = async (response: Response) => {
      if (response.status === 401){
        await signOut();
      }
  }     


  return (
    <AdminContext.Provider value={{
        users,
        upvotedList,
        downvotedList,
        unvotedList,
        config,
        addUser,
        loadUsers,
        deleteUser,
        updatePassword,
        updateRole,
        getAIConfig,
        updateAIConfig,
        getVotedOn,
        getThread,
      }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}