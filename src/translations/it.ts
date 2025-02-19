export const it = {
  common: {
    loading: 'Caricamento...',
    save: 'Salva',
    saving: 'Salvataggio...',
    saved: 'Impostazioni salvate con successo',
    error: 'Errore',
    back: 'Indietro',
    delete: 'Elimina',
    confirm: 'Conferma',
    cancel: 'Annulla',
    search: 'Cerca...',
    noData: 'Nessun dato disponibile',
    actions: 'Azioni',
  },
  dashboard: {
    title: 'Monitor Proprietà GA4',
    subtitle: 'Monitora le tue proprietà GA4 e traccia le anomalie nelle sessioni',
    addProperty: 'Aggiungi Proprietà',
    importProperties: 'Importa Proprietà',
    settings: 'Impostazioni',
    logout: 'Esci',
    sortFields: {
      name: 'Nome',
      propertyId: 'ID Proprietà',
      accountId: 'ID Account',
      lastChecked: 'Ultimo Controllo',
      sessions: 'Sessioni',
      status: 'Stato'
    },
    status: {
      normal: 'Normale',
      anomaly: 'Anomalia',
      pending: 'In Attesa'
    },
    checkNow: 'Controlla Ora',
    deleteConfirm: 'Sei sicuro di voler eliminare questa proprietà? Questa azione non può essere annullata.',
    filters: {
      all: 'Tutti gli Stati',
      allAccounts: 'Tutti gli Account',
      searchProperties: 'Cerca proprietà...',
      filterByStatus: 'Filtra per stato',
      filterByAccount: 'Filtra per account'
    },
    import: {
      title: 'Importa Proprietà GA4',
      accountId: 'ID Account',
      accountIdDesc: 'Inserisci il tuo ID account GA4 per importare tutte le proprietà accessibili',
      importing: 'Importazione in corso...',
      success: 'Importazione completata con successo: {imported} proprietà importate, {skipped} già presenti, {errors} errori.'
    },
    add: {
      title: 'Aggiungi Proprietà GA4',
      propertyId: 'ID Proprietà',
      accountId: 'ID Account',
      name: 'Nome Proprietà'
    },
    noProperties: {
      title: 'Nessuna proprietà aggiunta',
      description: 'Aggiungi la tua prima proprietà GA4 per iniziare il monitoraggio delle sessioni'
    },
    noResults: {
      title: 'Nessuna proprietà trovata',
      description: 'Prova a modificare i filtri o i termini di ricerca'
    },
    pagination: {
      previous: 'Precedente',
      next: 'Successivo',
      page: 'Pagina {current} di {total}',
      showing: 'Visualizzazione di {shown} su {total} proprietà'
    }
  },
  settings: {
    title: 'Impostazioni',
    subtitle: 'Configura il tuo Monitor Proprietà GA4',
    tabs: {
      anomaly: 'Rilevamento Anomalie',
      schedule: 'Pianificazione',
      notifications: 'Notifiche',
      preferences: 'Preferenze'
    },
    anomaly: {
      threshold: 'Soglia Anomalia (%)',
      thresholdDesc: 'Percentuale di calo delle sessioni da considerare come anomalia',
      minSessions: 'Sessioni Minime',
      minSessionsDesc: 'Numero minimo di sessioni richieste per controllare le anomalie',
      warningSeverity: 'Severità Avviso (%)',
      criticalSeverity: 'Severità Critica (%)',
      compareDays: 'Confronta con Ultimi (Giorni)',
      compareDaysDesc: 'Numero di giorni da confrontare per il rilevamento delle anomalie'
    },
    schedule: {
      frequency: 'Frequenza Controllo',
      frequencies: {
        hourly: 'Ogni Ora',
        daily: 'Giornaliero',
        custom: 'Personalizzato'
      },
      checkTime: 'Orario Controllo',
      cronExpression: 'Espressione Cron',
      cronDesc: 'Usa il formato cron (es. */30 * * * * per ogni 30 minuti)',
      timeZone: 'Fuso Orario'
    },
    notifications: {
      email: {
        title: 'Notifiche Email',
        description: 'Ricevi notifiche email per le anomalie',
        addresses: 'Email per Notifiche',
        addressesDesc: 'Separa più indirizzi email con virgole',
        smtp: {
          title: 'Impostazioni SMTP',
          host: 'Host SMTP',
          port: 'Porta SMTP',
          username: 'Username SMTP',
          password: 'Password SMTP',
          fromEmail: 'Email Mittente',
          fromName: 'Nome Mittente',
          testButton: 'Invia Email di Test'
        }
      },
      slack: {
        title: 'Webhook Slack (Opzionale)',
        placeholder: 'https://hooks.slack.com/services/...'
      },
      telegram: {
        title: 'ID Chat Telegram (Opzionale)',
        placeholder: '@nomechannel o ID chat'
      }
    },
    preferences: {
      pageSize: 'Dimensione Pagina Predefinita',
      sortField: 'Campo Ordinamento Predefinito',
      sortOrder: 'Ordine Predefinito',
      sortFields: {
        name: 'Nome',
        propertyId: 'ID Proprietà',
        accountId: 'ID Account',
        lastChecked: 'Ultimo Controllo',
        sessions: 'Sessioni',
        status: 'Stato'
      },
      sortOrders: {
        asc: 'Crescente',
        desc: 'Decrescente'
      }
    }
  }
} 