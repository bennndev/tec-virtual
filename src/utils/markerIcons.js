import AlmacenIcon from '../assets/icons/almacen.svg?react';
import AuditorioAIcon from '../assets/icons/auditorio-a.svg?react';
import AuditorioBIcon from '../assets/icons/auditorio-b.svg?react';
import BibliotecaIcon from '../assets/icons/biblioteca.svg?react';
import BicicletasIcon from '../assets/icons/bicicletas.svg?react';
import CafeteriaIcon from '../assets/icons/cafeteria.svg?react';
import EnfermeriaIcon from '../assets/icons/enfermeria.svg?react';
import EstacionamientoIcon from '../assets/icons/estacionamiento.svg?react';
import Laboratorio1Icon from '../assets/icons/laboratorio-1.svg?react';
import Laboratorio2Icon from '../assets/icons/laboratorio-2.svg?react';
import LockersIcon from '../assets/icons/lockers.svg?react';

export const getMarkerIcon = (markerId) => {
  if (!markerId) return Laboratorio2Icon;

  const idLower = markerId.toLowerCase().replace(/^zona_/, '').replace(/_/g, '-');

  if (idLower.includes('almacen'))           return AlmacenIcon;
  if (idLower.includes('auditorio-a'))       return AuditorioAIcon;
  if (idLower.includes('auditorio-b'))       return AuditorioBIcon;
  if (idLower.includes('biblioteca'))        return BibliotecaIcon;
  if (idLower.includes('bicicletas'))        return BicicletasIcon;
  if (idLower.includes('cafeteria'))         return CafeteriaIcon;
  if (idLower.includes('enfermeria'))        return EnfermeriaIcon;
  if (idLower.includes('estacionamiento'))   return EstacionamientoIcon;
  if (idLower.includes('laboratorio-1'))     return Laboratorio1Icon;
  if (idLower.includes('laboratorio-2'))     return Laboratorio2Icon;
  if (idLower.includes('lockers'))           return LockersIcon;

  // Stands principales o admisión
  if (idLower.includes('carreras') || idLower.includes('admision')) return Laboratorio1Icon;
  if (idLower.includes('empresas'))                                 return EstacionamientoIcon;
  if (idLower.includes('stand01') || idLower.includes('stand-principal')) return Laboratorio2Icon;
  if (idLower.includes('stand05') || idLower.includes('stand-de-informacion')) return BibliotecaIcon;

  return Laboratorio2Icon; // Fallback
};
