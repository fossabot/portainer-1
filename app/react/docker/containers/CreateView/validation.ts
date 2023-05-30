import { object, SchemaOf } from 'yup';

import { envVarValidation } from '@@/form-components/EnvironmentVariablesFieldset';

import { baseFormUtils } from './BaseForm';
import { capabilitiesTabUtils } from './CapabilitiesTab';
import { commandsTabUtils } from './CommandsTab';
import { labelsTabUtils } from './LabelsTab';
import { networkTabUtils } from './NetworkTab';
import { resourcesTabUtils } from './ResourcesTab';
import { restartPolicyTabUtils } from './RestartPolicyTab';
import { volumesTabUtils } from './VolumesTab';
import { Values } from './useInitialValues';

export function validation({
  isAdmin,
  maxCpu,
  maxMemory,
  isDuplicating,
  isDuplicatingPortainer,
}: {
  isAdmin: boolean;
  maxCpu: number;
  maxMemory: number;
  isDuplicating: boolean | undefined;
  isDuplicatingPortainer: boolean | undefined;
}): SchemaOf<Values> {
  return object({
    commands: commandsTabUtils.validation(),
    volumes: volumesTabUtils.validation(),
    network: networkTabUtils.validation(),
    labels: labelsTabUtils.validation(),
    restartPolicy: restartPolicyTabUtils.validation(),
    resources: resourcesTabUtils.validation({ maxCpu, maxMemory }),
    capabilities: capabilitiesTabUtils.validation(),
    env: envVarValidation(),
  }).concat(
    baseFormUtils.validation({ isAdmin, isDuplicating, isDuplicatingPortainer })
  );
}
