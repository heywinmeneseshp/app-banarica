import { useState } from 'react';
import { subirEvidencias } from '@services/api/googleDrive';
import {
  EVIDENCIA_MAX_FILES,
  EVIDENCIA_MAX_FILE_SIZE,
  EVIDENCIA_ALLOWED_TYPES,
} from '../programadorUtils';

export function useEvidencias({ evidenciasDriveFolderId, updateLocalRow, setAlert, setReloadKey }) {
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [selectedProgramacion, setSelectedProgramacion] = useState(null);
  const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
  const [evidenciaFiles, setEvidenciaFiles] = useState([]);
  const [evidenciaResultados, setEvidenciaResultados] = useState(null);

  const cerrarModalEvidencia = () => {
    if (uploadingEvidencia) return;
    setShowEvidenciaModal(false);
    setSelectedProgramacion(null);
    setEvidenciaFiles([]);
    setEvidenciaResultados(null);
  };

  const abrirModalEvidencia = (programacion) => {
    setSelectedProgramacion(programacion);
    setEvidenciaFiles([]);
    setEvidenciaResultados(null);
    setShowEvidenciaModal(true);
  };

  const handleEvidenciaFilesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > EVIDENCIA_MAX_FILES) {
      setAlert({
        active: true,
        mensaje: `Solo puedes subir maximo ${EVIDENCIA_MAX_FILES} fotos por envio.`,
        color: 'warning',
        autoClose: true,
      });
      e.target.value = '';
      return;
    }

    const invalidFile = files.find((file) => (
      !EVIDENCIA_ALLOWED_TYPES.includes(file.type) || file.size > EVIDENCIA_MAX_FILE_SIZE
    ));

    if (invalidFile) {
      setAlert({
        active: true,
        mensaje: `El archivo ${invalidFile.name} no es valido. Usa JPG, PNG, GIF o WEBP de maximo 5MB.`,
        color: 'warning',
        autoClose: true,
      });
      e.target.value = '';
      return;
    }

    setEvidenciaFiles(files);
  };

  const subirEvidenciasProgramacion = async () => {
    if (!selectedProgramacion) return;
    if (!evidenciaFiles.length) {
      setAlert({
        active: true,
        mensaje: 'Selecciona al menos una foto para subir.',
        color: 'warning',
        autoClose: true,
      });
      return;
    }

    setUploadingEvidencia(true);

    try {
      const itemEvidencia = selectedProgramacion.vehiculoLabel
        || selectedProgramacion.vehiculo?.placa
        || selectedProgramacion.contenedorLabel
        || selectedProgramacion.contenedor
        || `programacion-${selectedProgramacion.id || selectedProgramacion.consecutivo || 'sin-id'}`;

      const formData = new FormData();
      formData.append('programacion_id', selectedProgramacion.id || selectedProgramacion.consecutivo || '');
      formData.append('semana', selectedProgramacion.semanaLabel || selectedProgramacion.semana || '');
      formData.append('fecha', selectedProgramacion.fecha || '');
      formData.append('item', itemEvidencia);
      formData.append('vehiculo', selectedProgramacion.vehiculoLabel || selectedProgramacion.vehiculo?.placa || '');
      formData.append('contenedor', selectedProgramacion.contenedorLabel || selectedProgramacion.contenedor || '');
      formData.append(
        'finca_destino',
        selectedProgramacion.destino
          || selectedProgramacion.destinoLabel
          || selectedProgramacion.ruta?.ubicacion_2?.ubicacion
          || selectedProgramacion.ubicacion2
          || ''
      );
      formData.append('bl', selectedProgramacion.blLabel || selectedProgramacion.bl || '');
      formData.append('producto', selectedProgramacion.productoLabel || '');
      formData.append('carpetaID', evidenciasDriveFolderId);

      evidenciaFiles.forEach((file) => {
        formData.append('fotos', file);
      });

      const resultado = await subirEvidencias(formData);
      const payload = resultado?.data || resultado || {};
      const totalFotos = payload.totalFotos || payload.fotos?.length || evidenciaFiles.length;

      setEvidenciaResultados(payload);
      updateLocalRow(selectedProgramacion.id, (row) => ({
        ...row,
        evidencia_cargada: true,
        evidencia_carpeta_id: payload.carpetaId || row.evidencia_carpeta_id || '',
        evidencia_carpeta_url: payload.carpetaUrl || row.evidencia_carpeta_url || '',
        evidencia_fecha: new Date().toISOString(),
        evidencia_total_fotos: totalFotos,
      }));

      setAlert({
        active: true,
        mensaje: `Se subieron ${totalFotos} fotos exitosamente.`,
        color: 'success',
        autoClose: true,
      });

      setEvidenciaFiles([]);
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible subir las evidencias.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setUploadingEvidencia(false);
    }
  };

  return {
    showEvidenciaModal,
    selectedProgramacion,
    uploadingEvidencia,
    evidenciaFiles,
    evidenciaResultados,
    setEvidenciaFiles,
    setEvidenciaResultados,
    cerrarModalEvidencia,
    abrirModalEvidencia,
    handleEvidenciaFilesChange,
    subirEvidenciasProgramacion,
  };
}
