import _ from 'lodash';
import { FormikErrors } from 'formik';

import { useIsStandAlone } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { Gpu, Values as GPUValues } from './Gpu';
import { Values as RuntimeValues, RuntimeSection } from './RuntimeSection';
import { DevicesField, Values as Devices } from './DevicesField';
import { SysctlsField, Values as Sysctls } from './SysctlsField';
import {
  ResourceFieldset,
  Values as ResourcesValues,
} from './ResourcesFieldset';
import { EditResourcesForm } from './EditResourceForm';

export interface Values {
  runtime: RuntimeValues;

  devices: Devices;

  sysctls: Sysctls;

  sharedMemorySize: number;

  gpu: GPUValues;

  resources: ResourcesValues;
}

export function ResourcesTab({
  values,
  setFieldValue,
  errors,
  allowPrivilegedMode,
  isInitFieldVisible,
  isDevicesFieldVisible,
  isSysctlFieldVisible,
  isDuplicate,
  onUpdateLimits,
  isImageInvalid,
}: {
  values: Values;
  setFieldValue: (field: string, value: unknown) => void;
  errors?: FormikErrors<Values>;
  allowPrivilegedMode: boolean;
  isInitFieldVisible: boolean;
  isDevicesFieldVisible: boolean;
  isSysctlFieldVisible: boolean;
  isDuplicate?: boolean;
  onUpdateLimits: (values: ResourcesValues) => Promise<void>;
  isImageInvalid: boolean;
}) {
  const environmentId = useEnvironmentId();

  const environmentQuery = useCurrentEnvironment();

  const isStandalone = useIsStandAlone(environmentId);

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;
  const gpuUseAll = _.get(environment, 'Snapshots[0].GpuUseAll', false);
  const gpuUseList = _.get(environment, 'Snapshots[0].GpuUseList', []);

  return (
    <div className="mt-3">
      <RuntimeSection
        values={values.runtime}
        onChange={(runtime) => setFieldValue('runtime', runtime)}
        allowPrivilegedMode={allowPrivilegedMode}
        isInitFieldVisible={isInitFieldVisible}
      />

      {isDevicesFieldVisible && (
        <DevicesField
          values={values.devices}
          onChange={(devices) => setFieldValue('devices', devices)}
        />
      )}

      {isSysctlFieldVisible && (
        <SysctlsField
          values={values.sysctls}
          onChange={(sysctls) => setFieldValue('sysctls', sysctls)}
        />
      )}

      <FormControl label="Shared memory size" inputId="shm-size">
        <div className="flex items-center gap-4">
          <Input
            id="shm-size"
            type="number"
            min="1"
            value={values.sharedMemorySize}
            onChange={(e) =>
              setFieldValue('sharedMemorySize', e.target.valueAsNumber)
            }
            className="w-32"
          />
          <div className="small text-muted">
            Size of /dev/shm (<b>MB</b>)
          </div>
        </div>
      </FormControl>

      {isStandalone && (
        <Gpu
          values={values.gpu}
          onChange={(gpu) => setFieldValue('gpu', gpu)}
          gpus={environment.Gpus}
          enableGpuManagement={environment.EnableGPUManagement}
          usedGpus={gpuUseList}
          usedAllGpus={gpuUseAll}
        />
      )}

      {isDuplicate ? (
        <EditResourcesForm
          initialValues={values.resources}
          onSubmit={onUpdateLimits}
          isImageInvalid={isImageInvalid}
        />
      ) : (
        <ResourceFieldset
          values={values.resources}
          onChange={(resources) => setFieldValue('resources', resources)}
          errors={errors?.resources}
        />
      )}
    </div>
  );
}
