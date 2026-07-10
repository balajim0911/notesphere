import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDocs, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useStore } from './useStore';
import { Note } from '../types';
import { OperationType, handleFirestoreError } from './firestoreErrorHandler';

// Test connection on module boot to satisfy firebase-integration skill constraint
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test_connection_placeholder', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline:", error.message);
    }
  }
};
testConnection();

const isUnmodifiedInitialNote = (note: Note) => {
  if (String(note.id) === '1' && note.content === 'Welcome to NoteSphere 3D!\n\nDouble click any note to edit.\nDrag to move around.') {
    return true;
  }
  if (String(note.id) === '2' && note.content === 'Try searching notes or adding new ones from the toolbar below.') {
    return true;
  }
  return false;
};

const normalizePosition = (val: any): [number, number, number] => {
  if (Array.isArray(val)) {
    return [
      Number(val[0]) || 0,
      Number(val[1]) || 0,
      Number(val[2]) || 0
    ];
  }
  if (val && typeof val === 'object') {
    return [
      Number(val.x || val[0]) || 0,
      Number(val.y || val[1]) || 0,
      Number(val.z || val[2]) || 0
    ];
  }
  return [0, 0, 0];
};

const normalizeRotation = (val: any): [number, number, number] => {
  if (Array.isArray(val)) {
    return [
      Number(val[0]) || 0,
      Number(val[1]) || 0,
      Number(val[2]) || 0
    ];
  }
  if (val && typeof val === 'object') {
    return [
      Number(val.x || val[0]) || 0,
      Number(val.y || val[1]) || 0,
      Number(val.z || val[2]) || 0
    ];
  }
  return [0, 0, 0];
};

export function useFirestoreSync() {
  const { user, setUser, setSyncStatus, setNotesSilently } = useStore();
  const userUid = user?.uid;

  // 1. Listen to Auth State and User Document in Firestore
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (firebaseUser) {
        // Start listening to their /users/{uid} document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData.displayName || null,
            });
          } else {
            // First time or no document yet
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: null, // this will trigger the name prompt!
            });
          }
        }, (error) => {
          console.error("Error listening to user document:", error);
          // Fallback to auth displayName if firestore fails or is blocked
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
          });
        });
      } else {
        const currentUser = useStore.getState().user;
        if (currentUser?.isGuest) {
          return;
        }
        setUser(null);
        // Clear user-specific active notes on logout to protect user privacy
        // and restore default initial notes for an anonymous session
        import('../constants').then(({ INITIAL_NOTES }) => {
          setNotesSilently(INITIAL_NOTES.map((n, i) => ({ ...n, zIndex: i })));
        }).catch((err) => console.error("Failed to load INITIAL_NOTES on logout:", err));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        (unsubscribeUserDoc as () => void)();
      }
    };
  }, [setUser, setNotesSilently]);

  // 2. Synchronize with Firestore when user changes
  useEffect(() => {
    if (!userUid || user?.isGuest) {
      setSyncStatus('offline');
      return;
    }

    let isSubscribed = true;
    let unsubscribeNotes: (() => void) | null = null;
    const serverConfirmedNoteIds = new Set<string>();

    const initializeSync = async () => {
      try {
        setSyncStatus('syncing');

        // Sync database setup without automated fresh reset block for baburaom801@gmail.com to ensure no data loss.

        const q = query(collection(db, 'notes'), where('userId', '==', userUid));
        
        // 1. One-time fetch to merge local and remote notes safely without race conditions.
        // We use a Promise.race with a 5-second timeout to prevent the app from being stuck
        // in the 'syncing' state if the device's connection is firewalled, blocked by an adblocker,
        // or experiencing temporary network/CORS issues.
        const timeoutPromise = (ms: number) => new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore initial fetch timed out')), ms)
        );

        let snapshot;
        try {
          snapshot = await Promise.race([
            getDocs(q),
            timeoutPromise(5000)
          ]);
        } catch (fetchErr) {
          console.warn("Firestore initial fetch failed or timed out. Falling back to local state and starting live subscription:", fetchErr);
          // Create an empty dummy snapshot so the merge logic safely falls back to local notes
          snapshot = {
            forEach: () => {}
          } as any;
        }

        if (!isSubscribed) return;

        const firestoreNotesMap = new Map<string, Note>();
        const prefix = `${userUid}_`;
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data();
          const noteId = String(data.id || (docSnap.id.startsWith(prefix) ? docSnap.id.substring(prefix.length) : docSnap.id));
          serverConfirmedNoteIds.add(noteId);
          firestoreNotesMap.set(noteId, {
            id: noteId,
            content: data.content || '',
            color: data.color || '#fffbeb',
            position: normalizePosition(data.position),
            rotation: normalizeRotation(data.rotation),
            scale: data.scale !== undefined ? Number(data.scale) : 1,
            category: data.category || 'Ideas',
            tags: Array.isArray(data.tags) ? data.tags : [],
            isPinned: !!data.isPinned,
            isFavorite: !!data.isFavorite,
            lastModified: data.lastModified || Date.now(),
            zIndex: data.zIndex || 0,
            textureType: data.textureType || 'glass',
            fontStyle: data.fontStyle || 'sans',
          } as Note);
        });

        const localNotes = useStore.getState().notes;
        const finalNotesList: Note[] = [];
        const notesToUpload: Note[] = [];
        const hasRemoteNotes = firestoreNotesMap.size > 0;

        // Merge local notes
        for (const localNote of localNotes) {
          // If the user already has notes in Firestore, we discard unmodified initial template notes
          if (hasRemoteNotes && isUnmodifiedInitialNote(localNote)) {
            continue;
          }

          const dbNote = firestoreNotesMap.get(String(localNote.id));
          if (dbNote) {
            if (localNote.lastModified > dbNote.lastModified) {
              finalNotesList.push(localNote);
              notesToUpload.push(localNote);
            } else {
              finalNotesList.push(dbNote);
            }
          } else {
            // Unsynced note created locally
            finalNotesList.push(localNote);
            notesToUpload.push(localNote);
          }
        }

        // Add remaining firestore notes
        for (const [id, dbNote] of firestoreNotesMap.entries()) {
          if (!localNotes.some(n => String(n.id) === String(id))) {
            finalNotesList.push(dbNote);
          }
        }

        // If completely empty, seed INITIAL_NOTES
        if (finalNotesList.length === 0) {
          const { INITIAL_NOTES } = await import('../constants');
          const seededNotes = INITIAL_NOTES.map((n, i) => ({ ...n, zIndex: i }));
          finalNotesList.push(...seededNotes);
          notesToUpload.push(...seededNotes);
        }

        // Set state immediately so user sees their combined notes right away
        setNotesSilently(finalNotesList);

        // Upload any unsynced or updated notes to Firestore in the background.
        // We do not await this to prevent slow connections from delaying the 'synced' transition.
        if (notesToUpload.length > 0) {
          const uploadPromises = notesToUpload.map(note => 
            setDoc(doc(db, 'notes', `${userUid}_${note.id}`), { ...note, userId: userUid })
              .catch((err) => handleFirestoreError(err, OperationType.WRITE, `notes/${userUid}_${note.id}`))
          );
          Promise.all(uploadPromises);
        }

        setSyncStatus('synced');

        // 2. Subscribe to live changes only AFTER the initial merge is complete
        const snapshotPrefix = `${userUid}_`;
        unsubscribeNotes = onSnapshot(q, (liveSnapshot) => {
          if (!isSubscribed) return;

          const selectedNoteId = useStore.getState().selectedNoteId;
          const fetchedNotes: Note[] = [];

          liveSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const noteId = String(data.id || (docSnap.id.startsWith(snapshotPrefix) ? docSnap.id.substring(snapshotPrefix.length) : docSnap.id));
            
            // Only mark as confirmed if it has been successfully synchronized on the server
            if (!docSnap.metadata.hasPendingWrites) {
              serverConfirmedNoteIds.add(noteId);
            }
            
            let content = data.content || '';
            let lastModified = data.lastModified || Date.now();
            let color = data.color || '#fffbeb';
            let textureType = data.textureType || 'glass';
            let fontStyle = data.fontStyle || 'sans';
            let category = data.category || 'Ideas';
            let isPinned = !!data.isPinned;
            let isFavorite = !!data.isFavorite;
            let position = normalizePosition(data.position);
            let rotation = normalizeRotation(data.rotation);
            let scale = data.scale !== undefined ? Number(data.scale) : 1;
            let zIndex = data.zIndex || 0;
            let tags = Array.isArray(data.tags) ? data.tags : [];

            // Retrieve local note to compare timestamps or preserve edit state
            const localNote = useStore.getState().notes.find(n => String(n.id) === noteId);

            // If this note is currently being edited in the NoteEditor, OR if the local note has a
            // newer modification timestamp (e.g., pending local updates, debounced text, in-flight moves),
            // preserve the entire local state of this note to prevent rollback, cursors jumping, or flickering.
            if (noteId === selectedNoteId || (localNote && localNote.lastModified > lastModified)) {
              if (localNote) {
                content = localNote.content;
                lastModified = localNote.lastModified;
                color = localNote.color;
                textureType = localNote.textureType;
                fontStyle = localNote.fontStyle;
                category = localNote.category;
                isPinned = localNote.isPinned;
                isFavorite = localNote.isFavorite;
                position = normalizePosition(localNote.position);
                rotation = normalizeRotation(localNote.rotation);
                scale = localNote.scale;
                zIndex = localNote.zIndex;
                tags = localNote.tags;
              }
            }

            fetchedNotes.push({
              id: noteId,
              content,
              color,
              position,
              rotation,
              scale,
              category,
              tags,
              isPinned,
              isFavorite,
              lastModified,
              zIndex,
              textureType,
              fontStyle,
            } as Note);
          });

          // Keep any local notes that are NOT in the Firestore live snapshot (prevents them from disappearing)
          const localNotes = useStore.getState().notes;
          for (const localNote of localNotes) {
            const existsInFirestore = fetchedNotes.some(n => String(n.id) === String(localNote.id));
            if (!existsInFirestore) {
              fetchedNotes.push(localNote);
            }
          }

          setNotesSilently(fetchedNotes);
          setSyncStatus('synced');
        }, (error) => {
          console.error("Firestore onSnapshot subscription failed:", error);
          setSyncStatus('error');
        });

      } catch (err) {
        console.error("Failed to initialize sync:", err);
        setSyncStatus('error');
      }
    };

    initializeSync();

    return () => {
      isSubscribed = false;
      if (unsubscribeNotes) {
        unsubscribeNotes();
      }
    };
  }, [userUid, setNotesSilently, setSyncStatus]);
}
