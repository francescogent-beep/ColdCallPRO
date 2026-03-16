  const [sessionRejections, setSessionRejections] = useState<number>(0);

  // Auth listener
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        await handleRedirectResult();
      } catch (error: any) {
        setAuthError(error.message || 'Error during redirect sign-in.');
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) testConnection();
    });
    return () => unsubscribe();
  }, []);

  // Load data when auth is ready
  useEffect(() => {
    if (!isAuthReady) return;

    const loadData = async () => {
      try {
        const leads = await getLeads();
        const historicalSessions = await getSessions();
        setEntries(leads);
        setSessions(historicalSessions);
      } catch (error: any) {
        console.error("Error loading data:", error);
        // If it's a permission error, it might be due to rules or stale auth
        if (error.message?.includes('permission-denied')) {
          setAuthError("Permission denied. Your account might not have access to this data.");
        }
      }
    };
    loadData();
  }, [isAuthReady, user]);

  // Check for reminders every minute
  useEffect(() => {
    if (entries.length > 0) {
      checkReminders(entries); // Initial check
      const interval = setInterval(() => {
        checkReminders(entries);
      }, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [entries]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isAdding || activeCallId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isAdding, activeCallId]);

  const isRejection = (outcome: CallOutcome) => {
    return [
      CallOutcome.NOT_INTERESTED_HARD,
      CallOutcome.NOT_NOW,
      CallOutcome.ALREADY_GOT_SOMEONE
    ].includes(outcome);
  };

  const handleAdd = async (entry: CallLogEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    await saveLead(entry);
    setIsAdding(false);
    
    // Track session stats for new entry if it has a result
    if (entry.lastCallDate) {
      const newCalls = sessionCalls + 1;
      const newRejections = isRejection(entry.outcome) ? sessionRejections + 1 : sessionRejections;
      
      setSessionCalls(newCalls);
      setSessionRejections(newRejections);
      
      if (user) {
        await saveSession({
          id: currentSessionId,
          startTime: sessionStartTime,
          endTime: Date.now(),
          calls: newCalls,
          rejections: newRejections,
          uid: user.uid
        });
      }
    }
  };

  const handleUpdate = async (entry: CallLogEntry) => {
    const prev = entries.find(e => e.id === entry.id);
    const isNewCall = prev && entry.attemptNumber > prev.attemptNumber;
    
    const updated = entries.map(e => e.id === entry.id ? entry : e);
    setEntries(updated);
    await saveLead(entry);

    if (isNewCall) {
      const newCalls = sessionCalls + 1;
      const newRejections = isRejection(entry.outcome) ? sessionRejections + 1 : sessionRejections;
      
      setSessionCalls(newCalls);
      setSessionRejections(newRejections);

      if (user) {
        await saveSession({
          id: currentSessionId,
          startTime: sessionStartTime,
          endTime: Date.now(),
          calls: newCalls,
          rejections: newRejections,
          uid: user.uid
        });
      }
    }
    setActiveCallId(null);
  };

  const handleDelete = async (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    await deleteLead(id);
  };

  const handleBulkAdd = async (newEntries: CallLogEntry[], overwrite: boolean = false) => {
    let updated: CallLogEntry[];
    if (overwrite) {
      updated = newEntries;
      // In a real app, we'd batch delete old ones, but for now we just add new ones
      for (const entry of newEntries) {
        await saveLead(entry);
      }
    } else {
      const existingIds = new Set(entries.map(e => e.id));
      const existingPhones = new Set(entries.map(e => e.phone.replace(/\D/g, '')).filter(p => p !== ''));
      const seenInBatch = new Set<string>();

      const uniqueNew = newEntries.filter(e => {
        const cleanPhone = e.phone.replace(/\D/g, '');
        const isDuplicate = existingIds.has(e.id) || (cleanPhone !== '' && (existingPhones.has(cleanPhone) || seenInBatch.has(cleanPhone)));
        if (!isDuplicate && cleanPhone !== '') seenInBatch.add(cleanPhone);
        return !isDuplicate;
      });
      
      updated = [...uniqueNew, ...entries];
      for (const entry of uniqueNew) {
        await saveLead(entry);
      }
    }
    setEntries(updated);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'master':
        return (
          <MasterLog 
            entries={entries} 
            onAddRequest={() => setIsAdding(true)}
            onEditRequest={(id) => setActiveCallId(id)}
            onDelete={handleDelete}
            onBulkAdd={handleBulkAdd}
            onUpdate={handleUpdate}
          />
        );
      case 'followup':
        return (
          <FollowUpView 
            entries={entries} 
            onEditRequest={(id) => setActiveCallId(id)} 
          />
        );
      case 'metrics':
        return (
          <DailyMetrics entries={entries} historicalSessions={sessions} />
        );
      default:
        return null;
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase. Please add the current URL to "Authorized Domains" in your Firebase Console.');
      } else {
        setAuthError(error.message || 'An error occurred during sign in.');
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-indigo-500 p-4 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/20">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">ColdCall <span className="text-indigo-400">Pro</span></h1>
        <p className="text-slate-400 mb-8 max-w-xs">Your outreach data, synced across all your devices. Secure and reliable.</p>
        
        {authError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold leading-relaxed max-w-xs">
            {authError}
          </div>
        )}

        <button 
          onClick={handleSignIn}
          className="w-full max-w-xs py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sessionCalls={sessionCalls}
        sessionRejections={sessionRejections}
        sessionStartTime={sessionStartTime}
        user={user}
        onLogout={logOut}
      >
        {renderContent()}

        {(isAdding || activeCallId) && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto p-4 flex items-center justify-center">
            <LogForm
              initialData={activeCallId ? entries.find(e => e.id === activeCallId) : undefined}
              onSubmit={(entry) => {
                if (activeCallId) handleUpdate(entry);
                else handleAdd(entry);
              }}
              onCancel={() => {
                setIsAdding(false);
                setActiveCallId(null);
              }}
            />
          </div>
        )}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
