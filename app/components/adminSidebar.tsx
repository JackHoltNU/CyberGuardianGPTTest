'use client'

import React, { useEffect, useState } from "react";
import { ChatInstance, MessageHistory } from "../types/types";
import { useChatbot } from "../context/useChatbot";
import { Session } from 'next-auth';
import Link from "next/link";

interface Props {
    selected: number;
}

const AdminSidebar = ({selected}: Props) => {


    return (
      <aside className="sidebar">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Admin
        </div>
        <nav className="flex flex-col items">
          <ul>
            <li className={`item ${selected == 0 && "item--selected"}`}>
              <Link href="/dashboard" className="item__button">
                Dashboard
              </Link>
            </li>
            <li className={`item ${selected == 1 && "item--selected"}`}>
              <Link href="/manageUsers" className="item__button">
                Manage Users
              </Link>
            </li>
            <li className={`item ${selected == 2 && "item--selected"}`}>
              <Link href="/" className="item__button">
                Go To Chat
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    );
}

export default AdminSidebar;