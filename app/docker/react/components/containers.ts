import angular from 'angular';
import { ComponentProps } from 'react';

import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withFormValidation } from '@/react-tools/withFormValidation';
import {
  CommandsTab,
  CommandsTabValues,
  commandsTabValidation,
} from '@/react/docker/containers/CreateView/CommandsTab';
import {
  VolumesTab,
  volumesTabValidation,
} from '@/react/docker/containers/CreateView/VolumesTab';
import {
  NetworkTab,
  NetworkTabValues,
  networkTabValidation,
} from '@/react/docker/containers/CreateView/NetworkTab';
import {
  LabelsTab,
  labelsTabValidation,
} from '@/react/docker/containers/CreateView/LabelsTab';
import {
  RestartPolicyTab,
  restartPolicyTabValidation,
} from '@/react/docker/containers/CreateView/RestartPolicyTab';
import {
  ResourcesTab,
  resourcesTabValidation,
} from '@/react/docker/containers/CreateView/ResourcesTab';
import {
  CapabilitiesTab,
  capabilitiesTabValidation,
} from '@/react/docker/containers/CreateView/CapabilitiesTab';
import {
  BaseForm,
  baseFormValidation,
} from '@/react/docker/containers/CreateView/BaseForm';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

const ngModule = angular.module(
  'portainer.docker.react.components.containers',
  []
);

export const containersModule = ngModule.name;

withFormValidation<ComponentProps<typeof CommandsTab>, CommandsTabValues>(
  ngModule,
  withUIRouter(withReactQuery(CommandsTab)),
  'dockerCreateContainerCommandsTab',
  ['apiVersion'],
  commandsTabValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(VolumesTab)),
  'dockerCreateContainerVolumesTab',
  ['allowBindMounts'],
  volumesTabValidation
);

withFormValidation<ComponentProps<typeof NetworkTab>, NetworkTabValues>(
  ngModule,
  withUIRouter(withReactQuery(NetworkTab)),
  'dockerCreateContainerNetworkTab',
  ['apiVersion'],
  networkTabValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(LabelsTab)),
  'dockerCreateContainerLabelsTab',
  [],
  labelsTabValidation
);

withFormValidation(
  ngModule,
  RestartPolicyTab,
  'dockerCreateContainerRestartPolicyTab',
  [],
  restartPolicyTabValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(ResourcesTab)),
  'dockerCreateContainerResourcesTab',
  [
    'allowPrivilegedMode',
    'isDevicesFieldVisible',
    'isInitFieldVisible',
    'isSysctlFieldVisible',
    'isEdit',
    'isImageInvalid',
    'onUpdateLimits',
  ],
  resourcesTabValidation
);

withFormValidation(
  ngModule,
  CapabilitiesTab,
  'dockerCreateContainerCapabilitiesTab',
  [],
  capabilitiesTabValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(withCurrentUser(BaseForm))),
  'dockerCreateContainerBaseForm',
  ['isValid', 'isLoading'],
  baseFormValidation
);
