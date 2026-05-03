import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchCurrentUser, getAuthUser, storeAuthUser } from "../services/auth.service";
import { fetchDocuments } from "../services/document.service";

const AppDataContext = createContext(null);
const DOCUMENT_CACHE_LIMIT = 50;

const getToken = () => localStorage.getItem("docuthinker_token");

export const AppDataProvider = ({ children }) => {
  const userRequestRef = useRef(null);
  const documentsRequestRef = useRef(null);
  const [user, setUser] = useState(() => getAuthUser());
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(Boolean(getAuthUser()));
  const [areDocumentsLoaded, setAreDocumentsLoaded] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [areDocumentsLoading, setAreDocumentsLoading] = useState(false);

  const loadUser = useCallback(
    async ({ force = false } = {}) => {
      if (!getToken()) {
        return null;
      }

      if (!force && isUserLoaded && user) {
        return user;
      }

      if (userRequestRef.current) {
        return userRequestRef.current;
      }

      setIsUserLoading(true);

      const requestToken = getToken();

      userRequestRef.current = (async () => {
        const currentUser = await fetchCurrentUser();

        if (getToken() !== requestToken) {
          return null;
        }

        setUser(currentUser);
        storeAuthUser(currentUser);
        setIsUserLoaded(true);
        return currentUser;
      })();

      try {
        return await userRequestRef.current;
      } finally {
        userRequestRef.current = null;
        setIsUserLoading(false);
      }
    },
    [isUserLoaded, user]
  );

  const loadDocuments = useCallback(
    async ({ force = false } = {}) => {
      if (!getToken()) {
        return { documents: [], pagination: null };
      }

      if (!force && areDocumentsLoaded) {
        return { documents, pagination };
      }

      if (documentsRequestRef.current) {
        return documentsRequestRef.current;
      }

      setAreDocumentsLoading(true);

      const requestToken = getToken();

      documentsRequestRef.current = (async () => {
        const data = await fetchDocuments({ page: 1, limit: DOCUMENT_CACHE_LIMIT });
        const nextDocuments = data.documents || [];
        const nextPagination = data.pagination || null;

        if (getToken() !== requestToken) {
          return { documents: [], pagination: null };
        }

        setDocuments(nextDocuments);
        setPagination(nextPagination);
        setAreDocumentsLoaded(true);

        return { documents: nextDocuments, pagination: nextPagination };
      })();

      try {
        return await documentsRequestRef.current;
      } finally {
        documentsRequestRef.current = null;
        setAreDocumentsLoading(false);
      }
    },
    [areDocumentsLoaded, documents, pagination]
  );

  const loadInitialData = useCallback(
    async ({ force = false } = {}) => {
      if (!getToken()) {
        return;
      }

      await Promise.all([loadUser({ force }), loadDocuments({ force })]);
    },
    [loadDocuments, loadUser]
  );

  const addDocumentsToCache = useCallback((uploadedDocuments) => {
    const nextDocuments = Array.isArray(uploadedDocuments) ? uploadedDocuments : [uploadedDocuments];
    const validDocuments = nextDocuments.filter(Boolean);

    if (!validDocuments.length) {
      return;
    }

    setDocuments((currentDocuments) => {
      const uploadedIds = new Set(validDocuments.map((document) => document._id));
      return [
        ...validDocuments,
        ...currentDocuments.filter((document) => !uploadedIds.has(document._id)),
      ].slice(0, DOCUMENT_CACHE_LIMIT);
    });

    setPagination((currentPagination) =>
      currentPagination
        ? {
            ...currentPagination,
            total: (currentPagination.total || 0) + validDocuments.length,
          }
        : {
            page: 1,
            limit: DOCUMENT_CACHE_LIMIT,
            total: validDocuments.length,
            totalPages: 1,
          }
    );
    setAreDocumentsLoaded(true);
  }, []);

  const removeDocumentFromCache = useCallback((documentId) => {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document._id !== documentId)
    );
    setPagination((currentPagination) =>
      currentPagination
        ? {
            ...currentPagination,
            total: Math.max((currentPagination.total || 0) - 1, 0),
          }
        : currentPagination
    );
  }, []);

  const resetAppData = useCallback(() => {
    setUser(null);
    setDocuments([]);
    setPagination(null);
    setIsUserLoaded(false);
    setAreDocumentsLoaded(false);
    setIsUserLoading(false);
    setAreDocumentsLoading(false);
    userRequestRef.current = null;
    documentsRequestRef.current = null;
  }, []);

  useEffect(() => {
    if (getToken()) {
      loadInitialData();
    }
  }, [loadInitialData]);

  const value = useMemo(
    () => ({
      addDocumentsToCache,
      areDocumentsLoaded,
      areDocumentsLoading,
      documents,
      isUserLoaded,
      isUserLoading,
      loadDocuments,
      loadInitialData,
      loadUser,
      pagination,
      removeDocumentFromCache,
      resetAppData,
      user,
    }),
    [
      addDocumentsToCache,
      areDocumentsLoaded,
      areDocumentsLoading,
      documents,
      isUserLoaded,
      isUserLoading,
      loadDocuments,
      loadInitialData,
      loadUser,
      pagination,
      removeDocumentFromCache,
      resetAppData,
      user,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
};
