import React, { useEffect, useState, useCallback, useRef } from "react";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { getMessaging, onMessage } from "firebase/messaging";
import { getApps } from 'firebase/app';
import Link from "next/link";
import { useUserData } from "../context/userDataHook";
import router from "next/router";
import { useAuth } from "../context/authcontext";
import AuthModal from "./AuthPanel/AuthModal";
import Image from "next/image"; // ЗАМЕНИЛИ импорт
import {
  // ArrowRightOnRectangleIcon, // УДАЛЯЕМ устаревший
  ArrowLeftOnRectangleIcon, // ЗАМЕНЯЕМ на новый
  BellAlertIcon,
  ChartPieIcon,
  ChevronDownIcon,
  FireIcon,
  PlusCircleIcon,
  RectangleGroupIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/solid";

import Lottie from "lottie-react";
import logo from "../public/assets/anim/logo.json";

// УБИРАЕМ неиспользуемый тип Notification

export default function HeaderBizUtility(props: any) {
  const { userData } = useUserData();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<boolean>(false);
  const {
    user,
    notification,
    setNotification,
    logOut,
    authModal: { whichAuth, setWhichAuth },
  } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const messageListenerRef = useRef<(() => void) | null>(null);

  // Улучшаем получение пользователя из localStorage
  const [users, setUsers] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userParse = localStorage.getItem("user");
        if (userParse) {
          setUsers(JSON.parse(userParse));
        }
      } catch (error) {
        console.warn('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  // ИСПРАВЛЯЕМ зависимость загрузки
  useEffect(() => {
    const shouldLoad = !userData && !users;
    setLoading(shouldLoad);
  }, [userData, users]);

  // ИСПРАВЛЯЕМ Firebase Messaging
  const setupMessageListener = useCallback(() => {
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, skipping messaging setup');
      return null;
    }

    try {
      if (getApps().length > 0) {
        const messaging = getMessaging();
        
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Message received:', payload);
          // Обновляем уведомления
          if (payload.notification) {
            setNotification((prev: Array<{ title: string; body: string; link: string }>) => [...prev, {
              title: payload.notification?.title || 'New notification',
              body: payload.notification?.body || 'You have a new message',
              link: payload.data?.link || '#'
            }]);
            setCount(prev => (prev || 0) + 1);
          }
        });

        console.log('Firebase Messaging listener setup successfully');
        return unsubscribe;
      } else {
        console.log('Firebase not initialized, using mock messaging');
        return null;
      }
    } catch (error) {
      console.warn('Firebase Messaging setup failed:', error);
      return null;
    }
  }, [setNotification]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const unsubscribe = setupMessageListener();
      messageListenerRef.current = unsubscribe;
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (messageListenerRef.current) {
        messageListenerRef.current();
        messageListenerRef.current = null;
      }
    };
  }, [setupMessageListener]);

  const handleAuth = (value: string) => {
    setOpen(true);
    setWhichAuth(value);
  };

  const goToCompanyProfile = () => {
    userData && userData.userType === "company"
      ? router.push(`/company/profile/`)
      : router.push(`/users/profile`);
  };

  const goToDashboard = () => {
    userData && userData.userType === "company"
      ? router.push("/company/dashboard")
      : router.push("/users/dashboard");
  };

  const handleLogout = () => {
    logOut();
    router.push("/");
  };

  // Если загружается, показываем скелетон
  if (loading) {
    return (
      <div className="flex justify-end items-center w-full sticky top-0 z-50 px-5 md:px-6 py-3 bg-gradient-to-r from-fbblack-200 to-fbblack-100">
        <div className="text-left mx-auto w-[100px] lg:hidden ml-2">
          <div className="w-[100px] h-[40px] bg-gray-300 animate-pulse rounded" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 animate-pulse rounded-full" />
          <div className="w-20 h-4 bg-gray-300 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end items-center w-full sticky top-0 z-50 px-5 md:px-6 py-3 bg-gradient-to-r from-fbblack-200 to-fbblack-100">
        <div className="text-left mx-auto w-[100px] lg:hidden ml-2">
          <Link href="/" className="block">
            <Lottie animationData={logo} loop={false} />
          </Link>
        </div>
        {userData || users ? (
          <>
            <div className="relative">
              <NotificationPanel
                setCount={setCount}
                notification={notification}
              />

              {count && count > 0 ? (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </div>

            {/* USER PROFILE */}
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`
                    ${open ? "" : "text-opacity-90"}
                    flex relative items-center space-x-3 max-w whitespace-nowrap px-3 py-2 rounded-full bg-teal-700/40 hover:bg-teal-700/80 focus:outline-none focus-visible:ring-white transition-colors duration-200`}
                  >
                    {/* ЗАМЕНЯЕМ Image на OptimizedImage */}
                    <div className="w-[45px] h-[45px] rounded-full overflow-hidden">
                      <Image
                        src={
                          userData?.imgUrl || 
                          users?.imgUrl || 
                          "/assets/images/user_profile.png"
                        }
                        alt={userData?.userType === "company" ? "Company logo" : "User image"}
                        width={45}
                        height={45}
                        className="hover:scale-105 transition duration-300 ease-in-out cursor-pointer"
                        priority={true}
                      />
                    </div>

                    <span className="text-white truncate max-w-[120px]">
                      {userData?.name || users?.name || "User"}
                    </span>
                    <ChevronDownIcon className="w-3 h-3 text-white" />
                  </Popover.Button>
                  
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="bg-teal-700/90 backdrop-blur-sm rounded-sm absolute right-[0%] z-10 mt-3 w-fit sm:px-0 min-w-[222px]">
                      <div className="px-2 py-5 space-y-3">
                        {userData && userData.userType === "company" && (
                          <Link
                            href="/company/giveaway/"
                            className="popoverLink"
                          >
                            <PlusCircleIcon className="w-4 h-4 business-create" />
                            <span>Create Campaign</span>
                          </Link>
                        )}
                        
                        <button
                          className="popoverLink w-full"
                          onClick={goToDashboard}
                        >
                          <RectangleGroupIcon className="w-4 h-4 business-create" />
                          <span>Dashboard</span>
                        </button>
                        
                        <button
                          className="popoverLink w-full"
                          onClick={goToCompanyProfile}
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>Your Profile</span>
                        </button>
                        
                        {userData && userData.userType !== "company" && (
                          <Link href="/users/dashboard" className="popoverLink">
                            <FireIcon className="w-4 h-4" />
                            <span>Favorites</span>
                          </Link>
                        )}
                        
                        {userData && userData.userType === "company" && (
                          <Link href="/company/analytics" className="popoverLink">
                            <ChartPieIcon className="w-4 h-4" />
                            <span>Analytics</span>
                          </Link>
                        )}
                        
                        {userData && userData.userType === "company" && (
                          <Link
                            href="/company/followers"
                            className="popoverLink"
                          >
                            <UserGroupIcon className="w-4 h-4" />
                            <span>Followers</span>
                          </Link>
                        )}
                        
                        <button
                          className="popoverLink w-full"
                          onClick={handleLogout}
                        >
                          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </>
        ) : (
          <div className="md:inline-flex items-center space-x-5 px-2 py-2 md:px-0 md:py-0">
            <button
              className="buttonTertiary my-0 hover:text-yellow transition-colors duration-200"
              onClick={() => handleAuth("sign-in")}
            >
              Sign In
            </button>
            <button
              className="buttonTertiary my-0 hover:text-yellow transition-colors duration-200"
              onClick={() => handleAuth("")}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
      <AuthModal setOpen={setOpen} open={open} />
    </>
  );
}

function NotificationPanel({
  notification,
  setCount,
}: {
  notification: Array<{ title: string; body: string; link: string }>;
  setCount: React.Dispatch<React.SetStateAction<null | number>>;
}) {
  return (
    <div className="max-w-sm px-4">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`
                ${open ? "text-white" : "text-opacity-90"}
                group inline-flex items-center rounded-md px-3 py-2 text-base font-medium text-white hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-all duration-200`}
              onClick={() => setCount(null)}
            >
              <BellAlertIcon className="UtilityIcon" />
            </Popover.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute -left-1/2 z-10 mt-3 w-[250px] -translate-x-1/2 transform sm:px-0">
                <div className="overflow-hidden rounded-sm shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative group flex flex-col bg-teal-600/60 backdrop-blur-sm py-3 text-white max-h-[300px] overflow-y-auto">
                    {notification && notification.length > 0 ? (
                      notification.map((item, index) => (
                        <a
                          key={index}
                          href={item.link}
                          className="-m-3 flex p-6 items-center rounded-lg transition duration-150 ease-in-out group-hover:text-white hover:bg-[#162126] focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                        >
                          <div className="ml-4">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-sm opacity-80 line-clamp-2">{item.body}</p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="-m-3 flex p-6 items-center rounded-sm transition duration-150 ease-in-out">
                        <div className="text-center w-full opacity-60">
                          No notifications
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}