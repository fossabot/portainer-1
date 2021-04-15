angular.module('portainer.app').controller('InitAdminController', [
  '$async',
  '$scope',
  '$state',
  'Notifications',
  'Authentication',
  'StateManager',
  'SettingsService',
  'UserService',
  'BackupService',
  'StatusService',
  function ($async, $scope, $state, Notifications, Authentication, StateManager, SettingsService, UserService, BackupService, StatusService) {
    $scope.logo = StateManager.getState().application.logo;
    $scope.RESTORE_FORM_TYPES = { S3: 's3', FILE: 'file' }
    $scope.formValues = {
      Username: 'admin',
      Password: '',
      ConfirmPassword: '',
      enableTelemetry: true,
      restoreFormType: $scope.RESTORE_FORM_TYPES.FILE
    };

    $scope.state = {
      actionInProgress: false,
      showInitPassword: true,
      showRestorePortainer: false,
    };

    $scope.togglePanel = function () {
      $scope.state.showInitPassword = !$scope.state.showInitPassword;
      $scope.state.showRestorePortainer = !$scope.state.showRestorePortainer;
    };

    $scope.createAdminUser = function () {
      var username = $scope.formValues.Username;
      var password = $scope.formValues.Password;

      $scope.state.actionInProgress = true;
      UserService.initAdministrator(username, password)
        .then(function success() {
          return Authentication.login(username, password);
        })
        .then(function success() {
          return SettingsService.update({ enableTelemetry: $scope.formValues.enableTelemetry });
        })
        .then(() => {
          return StateManager.initialize();
        })
        .then(function () {
          return $state.go('portainer.init.license');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create administrator user');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function createAdministratorFlow() {
      UserService.administratorExists()
        .then(function success(exists) {
          if (exists) {
            $state.go('portainer.home');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to verify administrator account existence');
        });
    }

    createAdministratorFlow();

    async function waitPortainerRestart() {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
        try {
          const status = await StatusService.status();
          if (status && status.Version) {
            return;
          }
        } catch (e) { }
      }
      throw 'Timeout to wait for Portainer restarting';
    }

    $scope.uploadBackup = async function () {
      $scope.state.backupInProgress = true;
      const file = $scope.formValues.BackupFile;
      const password = $scope.formValues.Password;

      try {
        await BackupService.uploadBackup(file, password);
        await waitPortainerRestart();
        Notifications.success('The backup has successfully been restored');
        $state.go('portainer.auth');
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to restore the backup');
      } finally {
        $scope.state.backupInProgress = false;
      }
    };

    $scope.restoreFromS3 = async function () {
      $scope.state.backupInProgress = true;

      const payload = {
        AccessKeyID: $scope.formValues.AccessKeyId,
        CronRule: $scope.formValues.CronRule,
        Password: $scope.formValues.Password,
        SecretAccessKey: $scope.formValues.SecretAccessKey,
        Region: $scope.formValues.Region,
        BucketName: $scope.formValues.BucketName,
        Filename: $scope.formValues.Filename
      }

      try {
        await BackupService.restoreFromS3(payload);
        await waitPortainerRestart();
        Notifications.success('The backup has successfully been restored');
        $state.go('portainer.auth');
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to restore the backup');
      } finally {
        $scope.state.backupInProgress = false;
      }
    };
  },
]);
