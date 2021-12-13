package datastore

import (
	"fmt"
	"io"
	"path"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

func (store *Store) version() (int, error) {
	version, err := store.VersionService.DBVersion()
	if store.IsErrObjectNotFound(err) {
		version = 0
	}
	return version, err
}

func (store *Store) edition() portainer.SoftwareEdition {
	edition, err := store.VersionService.Edition()
	if store.IsErrObjectNotFound(err) {
		edition = portainer.PortainerCE
	}
	return edition
}

// NewStore initializes a new Store and the associated services
func NewStore(storePath string, fileService portainer.FileService, connection portainer.Connection) *Store {
	return &Store{
		fileService: fileService,
		connection:  connection,
	}
}

// Open opens and initializes the BoltDB database.
func (store *Store) Open() (bool, error) {
	newStore := true
	err := store.connection.Open()
	if err != nil {
		return newStore, err
	}

	// Check if DB is encrypted
	ok, err := store.connection.IsEncryptionRequired()
	if err != nil {
		logrus.Warnf("Error calling IsEncryptionRequired: %s", err.Error())
	}
	logrus.Infof("Is migration required?: %t", ok)
	if ok {
		// unencrypted database
		store.encryptDB()
	}

	// This creates the accessor structures, and should not mutate the data in any way
	err = store.initServices()
	if err != nil {
		return newStore, err
	}

	// if we have DBVersion in the database then ensure we flag this as NOT a new store
	version, err := store.VersionService.DBVersion()
	logrus.Infof("database version: %d", version)

	if err == nil {
		newStore = true
		logrus.WithField("version", version).Infof("Opened existing store")
	} else {
		if err.Error() == "encrypted string too short" {
			logrus.WithError(err).Debugf("open db failed - wrong encryption key")
		}
		if store.IsErrObjectNotFound(err) {
			logrus.WithError(err).Debugf("open db failed - object not found")
		} else {
			logrus.WithError(err).Debugf("open db failed - other")
		}
		return newStore, err
	}

	return newStore, nil
}

func (store *Store) Close() error {
	return store.connection.Close()
}

func (store *Store) encryptDB() error {
	// Since database is not encrypted so
	// settings this flag to false will not
	// allow connection to use encryption key
	store.connection.SetIsDBEncryptedFlag(false)
	err := store.initServices()
	if err != nil {
		logrus.Fatal("init services failed")
	}

	// export file path for backup
	exportFilename := path.Join(store.databasePath() + "." + fmt.Sprintf("backup-%d.json", time.Now().Unix()))

	logrus.Infof("exporting database backup to %s", exportFilename)
	err = store.Export(exportFilename)
	if err != nil {
		logrus.WithError(err).Debugf("failed to export to %s", exportFilename)
		return err
	}

	logrus.Infof("database backup exported")

	// Set isDBEncryptedFlag to true to import JSON in the encrypted format
	store.connection.SetIsDBEncryptedFlag(true)
	err = store.Import(exportFilename)
	if err != nil {
		logrus.Fatal(errors.ErrDBImportFailed.Error()) // TODO: Rollback?
	}

	logrus.Info("database successfully encrypted")
	// TODO: Delete the backup??
	return nil
}

// BackupTo backs up db to a provided writer.
// It does hot backup and doesn't block other database reads and writes
func (store *Store) BackupTo(w io.Writer) error {
	return store.connection.BackupTo(w)
}

// CheckCurrentEdition checks if current edition is community edition
func (store *Store) CheckCurrentEdition() error {
	if store.edition() != portainer.PortainerCE {
		return errors.ErrWrongDBEdition
	}
	return nil
}

// TODO: move the use of this to dataservices.IsErrObjectNotFound()?
func (store *Store) IsErrObjectNotFound(e error) bool {
	return e == errors.ErrObjectNotFound
}

func (store *Store) Rollback(force bool) error {
	return store.connectionRollback(force)
}
