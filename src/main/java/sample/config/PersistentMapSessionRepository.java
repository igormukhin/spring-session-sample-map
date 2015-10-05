package sample.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.session.ExpiringSession;
import org.springframework.session.MapSessionRepository;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by igor.mukhin on 05.10.2015.
 */
public class PersistentMapSessionRepository extends MapSessionRepository implements DisposableBean {
    private static final Logger logger = LoggerFactory.getLogger(PersistentMapSessionRepository.class);

    private File storageFile;
    private final Map<String, ExpiringSession> sessions;

    public PersistentMapSessionRepository(File storageFile, Map<String, ExpiringSession> sessions) {
        super(sessions);
        this.storageFile = storageFile;
        this.sessions = sessions;

        load();
    }

    @Override
    public void destroy() throws Exception {
        persist();
    }

    @SuppressWarnings("unchecked")
    private void load() {
        if (!storageFile.exists()) {
            return;
        }

        Map<String, ExpiringSession> data = null;
        logger.info("Loading sessions from {}", storageFile.getPath());
        try (InputStream in = new FileInputStream(storageFile); ObjectInputStream ois = new ObjectInputStream(in)) {
            data = (Map<String, ExpiringSession>) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            logger.warn("Persisted sessions failed to load from the disk", e);
        }

        if (data == null) {
            return;
        }

        sessions.putAll(data);
    }

    private void persist() {
        Map<String, ExpiringSession> data = new HashMap<>();
        data.putAll(sessions);

        logger.info("Persisting sessions to {}", storageFile.getPath());
        try (OutputStream out = new FileOutputStream(storageFile); ObjectOutputStream oos = new ObjectOutputStream(out)) {
            oos.writeObject(data);
        } catch (IOException e) {
            logger.warn("Failed to persist sessions to the disk", e);
        }
    }
}
