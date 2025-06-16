import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./SueldoCalculator.css";
// Importar los estilos adicionales
import "./SueldoCalculatorAdvanced.css"; // Asegúrate de crear este archivo con los estilos adicionales
import { CalculoInverso } from "./CalculoInverso"; // Nuevo componente para cálculo inverso

import {
  Button,
  Card,
  Input,
  Label,
  Switch,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from "@fluentui/react-components";

// Base de datos de AFP, ISAPRE, FONASA
const baseDatos = {
  afp: [
    { id: 1, nombre: "Capital", comision: 1.44, sis: 1.38 },
    { id: 2, nombre: "Cuprum", comision: 1.44, sis: 1.38 },
    { id: 3, nombre: "Habitat", comision: 1.27, sis: 1.38 },
    { id: 4, nombre: "PlanVital", comision: 1.16, sis: 1.38 },
    { id: 5, nombre: "ProVida", comision: 1.45, sis: 1.38 },
    { id: 6, nombre: "Modelo", comision: 0.58, sis: 1.38 },
    { id: 7, nombre: "Uno", comision: 0.49, sis: 1.38 }
  ],
  salud: [
    { id: 1, nombre: "FONASA", tipo: "estatal", cotizacion: 7, adicional: 0 },
    { id: 2, nombre: "Banmédica", tipo: "isapre", cotizacion: 7, adicional: 2.4 }, // 2.4 UF
    { id: 3, nombre: "Colmena", tipo: "isapre", cotizacion: 7, adicional: 2.2 },   // 2.2 UF
    { id: 4, nombre: "Cruz Blanca", tipo: "isapre", cotizacion: 7, adicional: 2.3 },
    { id: 5, nombre: "Nueva Masvida", tipo: "isapre", cotizacion: 7, adicional: 2.1 },
    { id: 6, nombre: "Vida Tres", tipo: "isapre", cotizacion: 7, adicional: 2.5 },
    { id: 7, nombre: "Esencial", tipo: "isapre", cotizacion: 7, adicional: 2.0 },
    { id: 8, nombre: "Consalud", tipo: "isapre", cotizacion: 7, adicional: 2.2 }
  ],
  meses: [
    { id: 1, nombre: "Enero", utm: 67429 },
    { id: 2, nombre: "Febrero", utm: 67294 },
    { id: 3, nombre: "Marzo", utm: 68034 },
    { id: 4, nombre: "Abril", utm: 68500 },  // Valores estimados para abril en adelante
    { id: 5, nombre: "Mayo", utm: 68750 },
    { id: 6, nombre: "Junio", utm: 69000 },
    { id: 7, nombre: "Julio", utm: 69250 },
    { id: 8, nombre: "Agosto", utm: 69500 },
    { id: 9, nombre: "Septiembre", utm: 69750 },
    { id: 10, nombre: "Octubre", utm: 70000 },
    { id: 11, nombre: "Noviembre", utm: 70250 },
    { id: 12, nombre: "Diciembre", utm: 70500 }
  ],
  // Tabla de impuesto único de segunda categoría
  iut: [
    { desde: 0, hasta: 13.5, factor: 0, rebaja: 0 },
    { desde: 13.5, hasta: 30, factor: 0.04, rebaja: 0.54 },
    { desde: 30, hasta: 50, factor: 0.08, rebaja: 1.74 },
    { desde: 50, hasta: 70, factor: 0.135, rebaja: 4.49 },
    { desde: 70, hasta: 90, factor: 0.23, rebaja: 11.14 },
    { desde: 90, hasta: 120, factor: 0.304, rebaja: 17.8 },
    { desde: 120, hasta: 310, factor: 0.35, rebaja: 23.32 },
    { desde: 310, hasta: Infinity, factor: 0.4, rebaja: 38.82 }
  ],
  // Nueva sección para tasas de Mutual de Seguridad
  mutualSeguridad: [
    { id: 1, nombre: "Administrativo/Comercio/Financiero/Educación", tasa: 0.93, adicional: 0 },
    { id: 2, nombre: "Agricultura, Ganadería y Sector Agrícola", tasa: 0.93, adicional: 1.7 },
    { id: 3, nombre: "Manufactura, Industria Alimentaria y Textil", tasa: 0.93, adicional: 1.7 },
    { id: 4, nombre: "Comercio y Retail", tasa: 0.93, adicional: 0.26 },
    { id: 5, nombre: "Construcción y Obras Civiles", tasa: 0.93, adicional: 2.55 },
    { id: 6, nombre: "Minería y Extracción", tasa: 0.93, adicional: 3.4 },
    { id: 7, nombre: "Transporte y Almacenamiento", tasa: 0.93, adicional: 2.55 },
    { id: 8, nombre: "Servicios Financieros y Profesionales", tasa: 0.93, adicional: 0 },
    { id: 9, nombre: "Otros Servicios con Tasa Especial", tasa: 0.93, adicional: 0.85 },
    { id: 10, nombre: "Personalizado", tasa: 0.93, adicional: 0 }
  ],
  // Parámetros generales
  parametros: {
    cotizacionObligatoria: 10.58, // 10% + 0.58% (Comisión AFP promedio)
    seguroCesantia: {
      trabajador: {
        indefinido: 0.6,
        plazoFijo: 0
      },
      empleador: {
        indefinido: 2.4,
        plazoFijo: 3.0
      }
    },
    topeImponible: {
      general: 86.5, // En UF
      iut: 87.528, // En UTM al mes
      seguroCesantia: 126.8, // En UF
      apv: 65.2 // En UF
    },
    uf: 37600, // Valor UF actual
    utm: 68034, // Valor UTM actual (marzo 2025)
    ingresoMinimoMensual: 510636 // NUEVO: Ingreso Mínimo Mensual (marzo 2025)
  }
};

// Modified HaberesImponibles component with advanced options
function HaberesImponibles({ state, updateState }) {
  // Extraer valores del estado global
  const { haberesImponibles } = state;

  // Estados para mostrar/ocultar los menús avanzados
  const [showGratificacionMenu, setShowGratificacionMenu] = useState(false);
  const [showInputManualHE, setShowInputManualHE] = useState(false); // Para cambiar a ingreso manual

  // Estado para almacenar múltiples entradas de horas extras
  const [horasExtrasList, setHorasExtrasList] = useState([
    { id: 1, horas: "", factor: "1.5", porcentaje: "50", esPersonalizado: false }
  ]);

  // Referencia al tope imponible
  const topeImponible = baseDatos.parametros.topeImponible.general * baseDatos.parametros.uf;

  // Estado para controlar advertencias
  const [showGratificacionWarning, setShowGratificacionWarning] = useState(false);

  // Función para actualizar un valor específico en el estado de haberes imponibles
  const actualizarHaber = useCallback((campo, valor) => {
    updateState({
      haberesImponibles: {
        ...haberesImponibles,
        [campo]: valor
      }
    });
  }, [haberesImponibles, updateState]);

  // Formateo de valores monetarios
  const handleFormatearMoneda = useCallback((e, campo) => {
    let valorInput = e.target.value;

    if (valorInput === "") {
      actualizarHaber(campo, "");
      return;
    }

    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");

    if (valorLimpio === "") {
      actualizarHaber(campo, "");
      return;
    }

    try {
      const valorNumerico = parseInt(valorLimpio, 10);

      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);

        // Verificar si es gratificación y supera el tope
        if (campo === "gratificacion") {
          const topeLegal = (parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0) * 0.25;
          const topeMax = Math.min(topeLegal, topeImponible / 12); // Tope mensual

          setShowGratificacionWarning(valorNumerico > topeMax);
        }

        actualizarHaber(campo, valorFormateado);
      } else {
        actualizarHaber(campo, valorLimpio);
      }
    } catch (err) {
      actualizarHaber(campo, valorLimpio);
    }
  }, [actualizarHaber, haberesImponibles.sueldoBase, topeImponible]);

  // Calcular total de haberes imponibles
  const total = useMemo(() => {
    return Object.entries(haberesImponibles).reduce((sum, [key, valor]) => {
      // Convertir valor string con formato a número
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [haberesImponibles]);

  // Formateo para mostrar moneda
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  // FUNCIÓN: Calcular gratificación como 25% del sueldo base + horas extras con tope
  // FUNCIÓN: Calcular gratificación como 25% del sueldo base + horas extras con tope
  const calcularGratificacion = useCallback(() => {
    const sueldoBase = parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0;
    const horasExtras = parseInt(haberesImponibles.horasExtras.replace(/\D/g, "")) || 0;

    if (sueldoBase === 0) {
      return;
    }

    // Base para calcular gratificación: sueldo base + horas extras
    const baseGratificacion = sueldoBase + horasExtras;

    // Calcular la gratificación legal (25% de la base)
    const gratificacionCalculada = baseGratificacion * 0.25;

    // MODIFICADO: Calcular el tope con IMM (4.75 * IMM / 12)
    const imm = baseDatos.parametros.ingresoMinimoMensual;
    const topeGratificacionMensual = (imm * 4.75) / 12; // Aproximadamente 202.127

    // Aplicar el tope
    const gratificacionConTope = Math.min(gratificacionCalculada, topeGratificacionMensual);

    // Formatear y actualizar
    const gratificacionFormateada = new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(gratificacionConTope);

    actualizarHaber("gratificacion", gratificacionFormateada);
  }, [haberesImponibles.sueldoBase, haberesImponibles.horasExtras, actualizarHaber]);

  // Función para agregar una nueva entrada de horas extras
  const agregarHorasExtras = useCallback(() => {
    setHorasExtrasList(prev => [
      ...prev,
      {
        id: Date.now(), // ID único
        horas: "",
        factor: "1.5",
        porcentaje: "50",
        esPersonalizado: false
      }
    ]);
  }, []);

  // Función para eliminar una entrada de horas extras
  const eliminarHorasExtras = useCallback((id) => {
    setHorasExtrasList(prev => prev.filter(item => item.id !== id));
  }, []);

  // Función para actualizar valores de una entrada específica de horas extras
  const actualizarHorasExtras = useCallback((id, field, value) => {
    setHorasExtrasList(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const newItem = { ...item, [field]: value };

        // Si estamos cambiando el tipo o el valor personalizado
        if (field === 'tipoRecargo') {
          if (value === 'personalizado') {
            newItem.esPersonalizado = true;
            // Mantener el porcentaje actual si ya estaba personalizado
            if (!item.esPersonalizado) {
              // Por defecto asignar 50% al cambiar a personalizado
              newItem.porcentaje = "50";
              newItem.factor = "1.5";
            }
          } else {
            newItem.esPersonalizado = false;
            // Asignar el factor y porcentaje predefinido
            switch (value) {
              case '50':
                newItem.factor = "1.5";
                newItem.porcentaje = "50";
                break;
              case '100':
                newItem.factor = "2.0";
                newItem.porcentaje = "100";
                break;
              case '25':
                newItem.factor = "1.25";
                newItem.porcentaje = "25";
                break;
              case '75':
                newItem.factor = "1.75";
                newItem.porcentaje = "75";
                break;
            }
          }
        }

        // Si estamos actualizando el porcentaje personalizado
        if (field === 'porcentaje' && item.esPersonalizado) {
          // Calcular el factor basado en el porcentaje
          const porcentajeNum = parseInt(value) || 0;
          newItem.factor = (1 + porcentajeNum / 100).toFixed(2);
        }

        return newItem;
      })
    );
  }, []);

  // FUNCIÓN: Calcular todas las horas extras
  const calcularTodasHorasExtras = useCallback(() => {
    const sueldoBase = parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0;

    if (sueldoBase === 0 || horasExtrasList.length === 0) {
      return;
    }

    // Cálculo del valor de la hora ordinaria según la fórmula chilena:
    // (Sueldo base / 30) * 28 / 176
    const valorHoraOrdinaria = (sueldoBase / 30) * 28 / 176;

    // Calcular el valor total sumando todas las entradas
    let valorTotalHorasExtras = 0;

    horasExtrasList.forEach(item => {
      const horas = parseFloat(item.horas) || 0;
      const factor = parseFloat(item.factor) || 1.5;

      if (horas > 0) {
        // Valor de esta entrada de horas extras
        const valorHoraExtra = valorHoraOrdinaria * factor;
        valorTotalHorasExtras += Math.round(horas * valorHoraExtra);
      }
    });

    // Formatear y actualizar
    const valorFormateado = new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(valorTotalHorasExtras);

    actualizarHaber("horasExtras", valorFormateado);
  }, [horasExtrasList, haberesImponibles.sueldoBase, actualizarHaber]);

  // Verificar si hay alguna entrada de horas extras válida
  const hayEntradasValidas = useMemo(() => {
    return horasExtrasList.some(item =>
      (parseFloat(item.horas) || 0) > 0
    );
  }, [horasExtrasList]);

  // Obtener el texto de descripción para el tipo de recargo seleccionado
  const getTipoRecargoTexto = useCallback((item) => {
    if (item.esPersonalizado) return `Personalizado (${item.porcentaje}%)`;

    switch (item.porcentaje) {
      case "50": return "Día normal (50%)";
      case "100": return "Domingo/Festivo (100%)";
      case "25": return "Recargo 25%";
      case "75": return "Recargo 75%";
      default: return `Recargo ${item.porcentaje}%`;
    }
  }, []);

  return (
    <div className="sueldo-section haberes-imponibles">
      <div className="section-header">
        <Text className="section-title">
          Haberes Imponibles
        </Text>
      </div>

      <div className="sueldo-grid">
        <div className="input-group">
          <Label className="input-label">Sueldo Base ($)</Label>
          <Input
            size="small"
            value={haberesImponibles.sueldoBase}
            onChange={(e) => handleFormatearMoneda(e, "sueldoBase")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label className="input-label">Horas Extras ($)</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                {showInputManualHE ? 'Modo manual' : 'Cálculo automático'}
              </span>
              <Switch
                checked={showInputManualHE}
                onChange={() => setShowInputManualHE(!showInputManualHE)}
                size="small"
              />
            </div>
          </div>

          {/* Mostrar el campo de entrada manual o el panel de cálculo según el modo */}
          {showInputManualHE ? (
            <Input
              size="small"
              value={haberesImponibles.horasExtras}
              onChange={(e) => handleFormatearMoneda(e, "horasExtras")}
              appearance="outline"
              placeholder="Ingrese monto manual"
            />
          ) : (
            /* Panel de cálculo automático (ahora visible por defecto) */
            <div className="menu-avanzado" style={{ width: '100%' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--info-box-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Horas extras</span>
                  <span>{haberesImponibles.horasExtras && `Total: ${haberesImponibles.horasExtras}`}</span>
                </div>

                <div className="calculo-panel-info" style={{ fontSize: '12px', marginBottom: '8px', padding: '5px', backgroundColor: 'rgba(0,120,212,0.05)', borderRadius: '4px' }}>
                  <div>Valor Hora Ordinaria: {formatearMoneda(Math.round((parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0) / 30 * 28 / 176))}</div>
                </div>

                {/* Lista de entradas de horas extras */}
                <div style={{ marginBottom: '8px' }}>
                  {horasExtrasList.map((item) => (
                    <div key={item.id} style={{
                      padding: '4px 6px',
                      marginBottom: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '4px',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        {/* Campo de horas */}
                        <div style={{ flex: '0 0 80px' }}>
                          <Input
                            size="small"
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.horas}
                            onChange={(e) => actualizarHorasExtras(item.id, 'horas', e.target.value)}
                            appearance="outline"
                            style={{ height: '30px', fontSize: '12px' }}
                            placeholder="Horas"
                          />
                        </div>

                        {/* Selector de tipo de recargo */}
                        <select
                          className="dropdown"
                          style={{ height: '30px', fontSize: '12px', flex: '1' }}
                          value={item.esPersonalizado ? 'personalizado' : item.porcentaje}
                          onChange={(e) => actualizarHorasExtras(item.id, 'tipoRecargo', e.target.value)}
                        >
                          <option value="50">Día normal (50%)</option>
                          <option value="100">Domingo/Festivo (100%)</option>
                          <option value="25">Recargo 25%</option>
                          <option value="75">Recargo 75%</option>
                          <option value="personalizado">Personalizado</option>
                        </select>

                        {/* Botón para eliminar esta entrada */}
                        {horasExtrasList.length > 1 && (
                          <Button
                            appearance="subtle"
                            size="small"
                            onClick={() => eliminarHorasExtras(item.id)}
                            style={{ height: '30px', width: '30px', padding: '0' }}
                            icon="✕"
                            title="Eliminar"
                          />
                        )}
                      </div>

                      {/* Campo para porcentaje personalizado */}
                      {item.esPersonalizado && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <div style={{ fontSize: '11px', marginRight: '8px' }}>Recargo:</div>
                          <Input
                            size="small"
                            type="number"
                            min="0"
                            max="200"
                            value={item.porcentaje}
                            onChange={(e) => actualizarHorasExtras(item.id, 'porcentaje', e.target.value)}
                            appearance="outline"
                            style={{ height: '26px', fontSize: '11px', width: '60px' }}
                          />
                          <div style={{ fontSize: '11px', marginLeft: '4px' }}>%</div>
                          <div style={{ fontSize: '11px', marginLeft: '8px' }}>
                            (Factor: {item.factor})
                          </div>
                        </div>
                      )}

                      {/* Resumen */}
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{getTipoRecargoTexto(item)}</span>
                        {item.horas && (
                          <span>
                            {item.horas} hr x {formatearMoneda(Math.round((parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0) / 30 * 28 / 176 * parseFloat(item.factor)))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    appearance="secondary"
                    size="small"
                    onClick={agregarHorasExtras}
                    style={{ fontSize: '11px', padding: '4px 8px', flex: '1', height: '28px' }}
                    icon="+"
                  >
                    Agregar otro tipo
                  </Button>

                  <Button
                    appearance="primary"
                    size="small"
                    onClick={calcularTodasHorasExtras}
                    style={{ fontSize: '11px', padding: '4px 8px', flex: '1', height: '28px' }}
                    disabled={!haberesImponibles.sueldoBase || !hayEntradasValidas}
                  >
                    Calcular total
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-group">
          <Label className="input-label">Bonos Imponibles ($)</Label>
          <Input
            size="small"
            value={haberesImponibles.bonosImponibles}
            onChange={(e) => handleFormatearMoneda(e, "bonosImponibles")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Comisiones ($)</Label>
          <Input
            size="small"
            value={haberesImponibles.comisiones}
            onChange={(e) => handleFormatearMoneda(e, "comisiones")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label className="input-label">Gratificación ($)</Label>
            <Button
              appearance="transparent"
              size="small"
              icon={showGratificacionMenu ? "▲" : "▼"}
              onClick={() => setShowGratificacionMenu(!showGratificacionMenu)}
              style={{ minWidth: 'auto', padding: '4px', marginLeft: '5px' }}
              title="Calcular gratificación"
            />
          </div>
          <Input
            size="small"
            value={haberesImponibles.gratificacion}
            onChange={(e) => handleFormatearMoneda(e, "gratificacion")}
            appearance="outline"
          />

          {/* Advertencia de tope excedido */}
          {showGratificacionWarning && (
            <div style={{ color: 'var(--error-color)', fontSize: '11px', marginTop: '4px' }}>
              El valor ingresado supera el monto legal o tope imponible.
            </div>
          )}

          {/* Menú avanzado para gratificación */}
          {showGratificacionMenu && (
            <div className="menu-avanzado">
              <div style={{ padding: '10px', backgroundColor: 'var(--info-box-bg)', borderRadius: '6px', marginTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Cálculo de Gratificación Legal
                </div>

                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  La gratificación legal corresponde al 25% del sueldo base + horas extras, con tope de 4.75 ingresos mínimos mensuales al año.
                </div>

                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                  <div>Sueldo Base: {formatearMoneda(parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0)}</div>
                  <div>Horas Extras: {formatearMoneda(parseInt(haberesImponibles.horasExtras.replace(/\D/g, "")) || 0)}</div>
                  <div>Base Cálculo: {formatearMoneda((parseInt(haberesImponibles.sueldoBase.replace(/\D/g, "")) || 0) + (parseInt(haberesImponibles.horasExtras.replace(/\D/g, "")) || 0))}</div>
                  <div>Tope mensual: {formatearMoneda(topeImponible / 12)}</div>
                </div>

                <Button
                  appearance="primary"
                  size="small"
                  onClick={calcularGratificacion}
                  style={{ width: '100%', height: '28px', fontSize: '12px' }}
                  disabled={!haberesImponibles.sueldoBase}
                >
                  Calcular Gratificación Legal
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="input-group">
          <Label className="input-label">Semana Corrida ($)</Label>
          <Input
            size="small"
            value={haberesImponibles.semanaCorrida}
            onChange={(e) => handleFormatearMoneda(e, "semanaCorrida")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Bono Vacaciones ($)</Label>
          <Input
            size="small"
            value={haberesImponibles.bonoVacaciones}
            onChange={(e) => handleFormatearMoneda(e, "bonoVacaciones")}
            appearance="outline"
          />
        </div>
      </div>

      <div className="sueldo-total">
        <span>Total Haberes Imponibles:</span>
        <span className="valor">{formatearMoneda(total)}</span>
      </div>
    </div>
  );
}


// Componente para Haberes No Imponibles
function HaberesNoImponibles({ state, updateState }) {
  // Extraer valores del estado global
  const { haberesNoImponibles } = state;

  // Función para actualizar un valor específico en el estado
  const actualizarHaber = useCallback((campo, valor) => {
    updateState({
      haberesNoImponibles: {
        ...haberesNoImponibles,
        [campo]: valor
      }
    });
  }, [haberesNoImponibles, updateState]);

  // Formateo de valores monetarios
  const handleFormatearMoneda = useCallback((e, campo) => {
    let valorInput = e.target.value;

    if (valorInput === "") {
      actualizarHaber(campo, "");
      return;
    }

    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");

    if (valorLimpio === "") {
      actualizarHaber(campo, "");
      return;
    }

    try {
      const valorNumerico = parseInt(valorLimpio, 10);

      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);

        actualizarHaber(campo, valorFormateado);
      } else {
        actualizarHaber(campo, valorLimpio);
      }
    } catch (err) {
      actualizarHaber(campo, valorLimpio);
    }
  }, [actualizarHaber]);

  // Calcular total de haberes no imponibles
  const total = useMemo(() => {
    return Object.entries(haberesNoImponibles).reduce((sum, [key, valor]) => {
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [haberesNoImponibles]);

  // Formateo para mostrar moneda
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  return (
    <div className="sueldo-section haberes-no-imponibles">
      <div className="section-header">
        <Text className="section-title">
          Haberes No Imponibles
        </Text>
      </div>

      <div className="sueldo-grid">
        <div className="input-group">
          <Label className="input-label">Colación ($)</Label>
          <Input
            size="small"
            value={haberesNoImponibles.colacion}
            onChange={(e) => handleFormatearMoneda(e, "colacion")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Movilización ($)</Label>
          <Input
            size="small"
            value={haberesNoImponibles.movilizacion}
            onChange={(e) => handleFormatearMoneda(e, "movilizacion")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Asignación Familiar ($)</Label>
          <Input
            size="small"
            value={haberesNoImponibles.asignacionFamiliar}
            onChange={(e) => handleFormatearMoneda(e, "asignacionFamiliar")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Viáticos ($)</Label>
          <Input
            size="small"
            value={haberesNoImponibles.viaticos}
            onChange={(e) => handleFormatearMoneda(e, "viaticos")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Sala Cuna ($)</Label>
          <Input
            size="small"
            value={haberesNoImponibles.salaCuna}
            onChange={(e) => handleFormatearMoneda(e, "salaCuna")}
            appearance="outline"
          />
        </div>
      </div>

      <div className="sueldo-total">
        <span>Total Haberes No Imponibles:</span>
        <span className="valor">{formatearMoneda(total)}</span>
      </div>
    </div>
  );
}

// Componente para Descuentos Previsionales
// Componente para Descuentos Previsionales
function DescuentosPrevisionales({ state, updateState }) {
  // Extraer valores y parámetros necesarios
  const {
    afpSeleccionada,
    saludSeleccionada,
    tipoContrato,
    haberesImponibles,
    descuentosPrevisionales,
    mesActual
  } = state;

  // Estado para controlar el modo de entrada de APV (dinero o UF)
  const [apvEnUF, setApvEnUF] = useState(false);

  // Estado para almacenar el valor de APV en UF
  const [apvUF, setApvUF] = useState("");

  // Obtener los valores de AFP y Salud seleccionados - memoizados
  const { afpInfo, saludInfo, mesInfo } = useMemo(() => {
    return {
      afpInfo: baseDatos.afp.find(a => a.id === parseInt(afpSeleccionada)) || null,
      saludInfo: baseDatos.salud.find(s => s.id === parseInt(saludSeleccionada)) || null,
      mesInfo: baseDatos.meses.find(m => m.id === parseInt(mesActual)) || baseDatos.meses[2]
    };
  }, [afpSeleccionada, saludSeleccionada, mesActual]);

  // Obtener parámetros generales
  const { cotizacionObligatoria, seguroCesantia, topeImponible, uf, utm } = baseDatos.parametros;

  // Calcular total haberes imponibles - memoizado
  const totalImponible = useMemo(() => {
    return Object.entries(haberesImponibles).reduce((sum, [key, valor]) => {
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [haberesImponibles]);

  // Calcular el tope imponible en pesos - memoizado
  const topeImponiblePesos = useMemo(() => {
    return topeImponible.general * uf;
  }, [topeImponible.general, uf]);

  // Obtener la base imponible (con tope) - memoizado
  const baseImponible = useMemo(() => {
    return Math.min(totalImponible, topeImponiblePesos);
  }, [totalImponible, topeImponiblePesos]);

  // Función para actualizar un valor específico en el estado - memoizada
  const actualizarDescuento = useCallback((campo, valor) => {
    updateState({
      descuentosPrevisionales: {
        ...descuentosPrevisionales,
        [campo]: valor
      }
    });
  }, [descuentosPrevisionales, updateState]);

  // Formateo para mostrar moneda - memoizado
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  // Formatear valor UF - memoizado
  const formatearUF = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(valor);
  }, []);

  // Actualizar APV en pesos - memoizada
  const handleFormatearAPV = useCallback((e) => {
    let valorInput = e.target.value;

    if (valorInput === "") {
      actualizarDescuento("apv", "");
      return;
    }

    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");

    if (valorLimpio === "") {
      actualizarDescuento("apv", "");
      return;
    }

    try {
      const valorNumerico = parseInt(valorLimpio, 10);

      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);

        actualizarDescuento("apv", valorFormateado);

        // Actualizar también el valor en UF si está activo el modo UF
        if (apvEnUF) {
          const valorUF = valorNumerico / uf;
          setApvUF(valorUF.toFixed(2));
        }
      } else {
        actualizarDescuento("apv", valorLimpio);
      }
    } catch (err) {
      actualizarDescuento("apv", valorLimpio);
    }
  }, [actualizarDescuento, apvEnUF, uf]);

  // Manejar entrada de APV en UF
  const handleApvUFChange = useCallback((e) => {
    const valor = e.target.value;

    // Permitir solo números y hasta un punto decimal
    if (!/^\d*\.?\d{0,2}$/.test(valor) && valor !== "") {
      return;
    }

    setApvUF(valor);

    if (valor === "") {
      actualizarDescuento("apv", "");
      return;
    }

    // Convertir UF a pesos
    const valorUF = parseFloat(valor);
    if (!isNaN(valorUF)) {
      const valorPesos = Math.round(valorUF * uf);

      // Formatear con separadores de miles
      const valorFormateado = new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      }).format(valorPesos);

      actualizarDescuento("apv", valorFormateado);
    }
  }, [actualizarDescuento, uf]);

  // Cambiar entre modos de entrada (CLP y UF)
  const toggleApvMode = useCallback(() => {
    const newMode = !apvEnUF;
    setApvEnUF(newMode);

    // Si hay un valor en APV, convertirlo al otro formato
    if (descuentosPrevisionales.apv) {
      const valorPesos = parseInt(descuentosPrevisionales.apv.replace(/\D/g, "")) || 0;

      if (newMode) {
        // Convertir de pesos a UF
        const valorUF = valorPesos / uf;
        setApvUF(valorUF.toFixed(2));
      }
    }
  }, [apvEnUF, descuentosPrevisionales.apv, uf]);

  // Calcular cotizaciones - memoizado
  // Calcular cotizaciones - memoizado
  const cotizaciones = useMemo(() => {
    // Cotización AFP (Obligatoria + Comisión)
    const cotizacionAfpObligatoria = baseImponible * (10 / 100);

    // Comisión AFP
    const comisionAfp = afpInfo ? baseImponible * (afpInfo.comision / 100) : 0;

    // Cotización de Salud
    let cotizacionSalud = 0;
    let cotizacionAdicionalSalud = 0;

    if (saludInfo) {
      // Cotización base 7% sobre la base imponible
      cotizacionSalud = baseImponible * (saludInfo.cotizacion / 100);

      if (saludInfo.tipo === "isapre") {
        // Usar el valor ingresado por el usuario en lugar del valor fijo
        const planUf = state.planUf || 0;
        cotizacionAdicionalSalud = planUf * baseDatos.parametros.uf;
      }
    }

    // Seguro de Cesantía (parte del trabajador)
    const porcentajeSeguroCesantia = tipoContrato === "indefinido"
      ? seguroCesantia.trabajador.indefinido
      : seguroCesantia.trabajador.plazoFijo;

    const seguroCesantiaTrabajador = baseImponible * (porcentajeSeguroCesantia / 100);

    // SIS (Seguro de Invalidez y Sobrevivencia) - MODIFICADO: Calculado pero no incluido en descuentos
    const sis = afpInfo ? baseImponible * (afpInfo.sis / 100) : 0;

    // APV (si existe)
    let apv = 0;
    if (descuentosPrevisionales.apv) {
      apv = parseInt(descuentosPrevisionales.apv.toString().replace(/\D/g, "")) || 0;

      // Verificar tope APV (considerando 65.2 UF al año, aproximado mensual)
      const topeAPVMensual = (topeImponible.apv * uf) / 12;
      apv = Math.min(apv, topeAPVMensual);
    }

    // Total descuentos previsionales - MODIFICADO: No incluye SIS
    const totalDescuentos = cotizacionAfpObligatoria + comisionAfp + cotizacionSalud +
      cotizacionAdicionalSalud + seguroCesantiaTrabajador + apv;

    return {
      cotizacionAfpObligatoria,
      comisionAfp,
      cotizacionSalud,
      cotizacionAdicionalSalud,
      seguroCesantiaTrabajador,
      sis, // Mantenemos para fines informativos
      apv,
      totalDescuentos // Ya no incluye SIS
    };
  }, [
    baseImponible,
    afpInfo,
    saludInfo,
    tipoContrato,
    seguroCesantia,
    descuentosPrevisionales.apv,
    topeImponible.apv,
    uf,
    state.planUf
  ]);

  // Formateo para mostrar porcentajes - memoizado
  const formatearPorcentaje = useCallback((valor) => {
    return valor.toFixed(2) + "%";
  }, []);

  // Calcular tope APV mensual
  const topeAPVMensual = useMemo(() => {
    return (topeImponible.apv * uf) / 12;
  }, [topeImponible.apv, uf]);

  // Calcular tope APV mensual en UF
  const topeAPVMensualUF = useMemo(() => {
    return topeImponible.apv / 12;
  }, [topeImponible.apv]);

  // Usar debounce para actualizar los descuentos calculados
  useEffect(() => {
    const timer = setTimeout(() => {
      updateState({
        descuentosCalculados: cotizaciones
      });
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [cotizaciones, updateState]);

  return (
    <div className="sueldo-section descuentos-previsionales">
      <div className="section-header">
        <Text className="section-title">
          Descuentos Previsionales
        </Text>
      </div>

      <div className="sueldo-grid">
        <div className="input-group">
          <Label className="input-label">AFP</Label>
          <select
            className="dropdown"
            value={afpSeleccionada}
            onChange={(e) => updateState({ afpSeleccionada: e.target.value })}
          >
            <option value="">-- Seleccionar AFP --</option>
            {baseDatos.afp.map(afp => (
              <option key={afp.id} value={afp.id}>
                {afp.nombre} ({formatearPorcentaje(afp.comision)})
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <Label className="input-label">Salud</Label>
          <select
            className="dropdown"
            value={saludSeleccionada}
            onChange={(e) => updateState({ saludSeleccionada: e.target.value })}
          >
            <option value="">-- Seleccionar Sistema de Salud --</option>
            {baseDatos.salud.map(salud => (
              <option key={salud.id} value={salud.id}>
                {salud.nombre} ({salud.tipo})
              </option>
            ))}
          </select>
        </div>

        {/* Agregar el nuevo campo para el plan en UF cuando se selecciona una ISAPRE */}
        {saludInfo && saludInfo.tipo === "isapre" && (
          <div className="input-group">
            <Label className="input-label">Plan en UF</Label>
            <Input
              size="small"
              type="number"
              min="0"
              step="0.1"
              value={state.planUf || ""}
              onChange={(e) => {
                const valor = parseFloat(e.target.value) || 0;
                updateState({ planUf: valor });
              }}
              appearance="outline"
              placeholder="Ej: 3.5"
            />
          </div>
        )}

        <div className="input-group">
          <Label className="input-label">Tipo de Contrato</Label>
          <select
            className="dropdown"
            value={tipoContrato}
            onChange={(e) => updateState({ tipoContrato: e.target.value })}
          >
            <option value="indefinido">Indefinido</option>
            <option value="plazoFijo">Plazo Fijo</option>
          </select>
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label className="input-label">
              APV ({apvEnUF ? 'UF' : 'CLP'})
            </Label>
            <Switch
              checked={apvEnUF}
              onChange={toggleApvMode}
              label={apvEnUF ? "UF" : "CLP"}
              labelPosition="before"
              style={{ fontSize: '12px' }}
            />
          </div>

          {apvEnUF ? (
            <Input
              size="small"
              type="text"
              value={apvUF}
              onChange={handleApvUFChange}
              appearance="outline"
              placeholder="Valor en UF"
            />
          ) : (
            <Input
              size="small"
              value={descuentosPrevisionales.apv}
              onChange={handleFormatearAPV}
              appearance="outline"
              placeholder="Valor en pesos"
            />
          )}

          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
            {apvEnUF
              ? `Tope mensual: ${formatearUF(topeAPVMensualUF)} UF (${formatearMoneda(topeAPVMensual)})`
              : `Tope mensual: ${formatearMoneda(topeAPVMensual)} (${formatearUF(topeAPVMensualUF)} UF)`
            }
          </div>
        </div>
      </div>

      {/* Reemplazar esta sección en el componente DescuentosPrevisionales */}

      <div className="calculo-seccion">
        <div className="calculo-titulo">Cálculo de Cotizaciones</div>

        <div className="calculo-linea">
          <span>Base imponible:</span>
          <span>{formatearMoneda(baseImponible)}</span>
        </div>

        <div className="calculo-linea">
          <span>AFP Cotización obligatoria (10%):</span>
          <span>{formatearMoneda(cotizaciones.cotizacionAfpObligatoria)}</span>
        </div>

        {afpInfo && (
          <>
            <div className="calculo-linea">
              <span>AFP Comisión ({formatearPorcentaje(afpInfo.comision)}):</span>
              <span>{formatearMoneda(cotizaciones.comisionAfp)}</span>
            </div>
            <div className="calculo-linea">
              <span>SIS ({formatearPorcentaje(afpInfo.sis)}) - Paga el empleador:</span>
              <span>{formatearMoneda(cotizaciones.sis)}</span>
            </div>
          </>
        )}

        {saludInfo && (
          <div className="calculo-linea">
            <span>Cotización {saludInfo.nombre} ({formatearPorcentaje(saludInfo.cotizacion)}):</span>
            <span>{formatearMoneda(cotizaciones.cotizacionSalud)}</span>
          </div>
        )}

        {saludInfo && saludInfo.tipo === "isapre" && (
          <div className="calculo-linea">
            <span>Adicional ISAPRE:</span>
            <span>{formatearMoneda(cotizaciones.cotizacionAdicionalSalud)}</span>
          </div>
        )}

        <div className="calculo-linea">
          <span>Seguro Cesantía ({formatearPorcentaje(tipoContrato === "indefinido" ? seguroCesantia.trabajador.indefinido : seguroCesantia.trabajador.plazoFijo)}):</span>
          <span>{formatearMoneda(cotizaciones.seguroCesantiaTrabajador)}</span>
        </div>

        {descuentosPrevisionales.apv && parseInt(descuentosPrevisionales.apv.replace(/\D/g, "")) > 0 && (
          <div className="calculo-linea">
            <span>APV{apvEnUF ? ` (${apvUF} UF)` : ''}:</span>
            <span>{formatearMoneda(cotizaciones.apv)}</span>
          </div>
        )}
      </div>

      <div className="sueldo-total">
        <span>Total Descuentos Previsionales:</span>
        <span className="valor">{formatearMoneda(cotizaciones.totalDescuentos)}</span>
      </div>
    </div>
  );
}

// Componente para Otros Descuentos
function OtrosDescuentos({ state, updateState }) {
  // Extraer valores del estado global
  const { otrosDescuentos } = state;

  // Función para actualizar un valor específico en el estado - memoizada
  const actualizarDescuento = useCallback((campo, valor) => {
    updateState({
      otrosDescuentos: {
        ...otrosDescuentos,
        [campo]: valor
      }
    });
  }, [otrosDescuentos, updateState]);

  // Formateo de valores monetarios - memoizado
  const handleFormatearMoneda = useCallback((e, campo) => {
    let valorInput = e.target.value;

    if (valorInput === "") {
      actualizarDescuento(campo, "");
      return;
    }

    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");

    if (valorLimpio === "") {
      actualizarDescuento(campo, "");
      return;
    }

    try {
      const valorNumerico = parseInt(valorLimpio, 10);

      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);

        actualizarDescuento(campo, valorFormateado);
      } else {
        actualizarDescuento(campo, valorLimpio);
      }
    } catch (err) {
      actualizarDescuento(campo, valorLimpio);
    }
  }, [actualizarDescuento]);

  // Calcular total de descuentos - memoizado
  const total = useMemo(() => {
    return Object.entries(otrosDescuentos).reduce((sum, [key, valor]) => {
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [otrosDescuentos]);

  // Formateo para mostrar moneda - memoizado
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  // Usar debounce para actualizar el total de otros descuentos
  useEffect(() => {
    const timer = setTimeout(() => {
      updateState({
        totalOtrosDescuentos: total
      });
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [total, updateState]);

  return (
    <div className="sueldo-section otros-descuentos">
      <div className="section-header">
        <Text className="section-title">
          Otros Descuentos
        </Text>
      </div>

      <div className="sueldo-grid">
        <div className="input-group">
          <Label className="input-label">Anticipos ($)</Label>
          <Input
            size="small"
            value={otrosDescuentos.anticipos}
            onChange={(e) => handleFormatearMoneda(e, "anticipos")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Préstamos ($)</Label>
          <Input
            size="small"
            value={otrosDescuentos.prestamos}
            onChange={(e) => handleFormatearMoneda(e, "prestamos")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Descuentos Judiciales ($)</Label>
          <Input
            size="small"
            value={otrosDescuentos.descuentosJudiciales}
            onChange={(e) => handleFormatearMoneda(e, "descuentosJudiciales")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Cuotas Sindicales ($)</Label>
          <Input
            size="small"
            value={otrosDescuentos.cuotasSindicales}
            onChange={(e) => handleFormatearMoneda(e, "cuotasSindicales")}
            appearance="outline"
          />
        </div>

        <div className="input-group">
          <Label className="input-label">Seguros Complementarios ($)</Label>
          <Input
            size="small"
            value={otrosDescuentos.segurosComplementarios}
            onChange={(e) => handleFormatearMoneda(e, "segurosComplementarios")}
            appearance="outline"
          />
        </div>
      </div>

      <div className="sueldo-total">
        <span>Total Otros Descuentos:</span>
        <span className="valor">{formatearMoneda(total)}</span>
      </div>
    </div>
  );
}

// Componente para la tabla de referencia
function TablaReferencia({ state }) {
  const { mesActual } = state;

  // Memoizar datos del mes
  const mesInfo = useMemo(() => {
    return baseDatos.meses.find(m => m.id === parseInt(mesActual)) || baseDatos.meses[2]; // Default a marzo
  }, [mesActual]);

  // Formateo para mostrar moneda - memoizado
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  // Formateo para porcentajes - memoizado
  const formatearFactor = useCallback((factor) => {
    return (factor * 100).toFixed(1) + "%";
  }, []);

  // Convertir tabla de impuestos a pesos - memoizado
  const tablaImpuestosPesos = useMemo(() => {
    return baseDatos.iut.map(tramo => {
      return {
        ...tramo,
        desdePesos: tramo.desde * mesInfo.utm,
        hastaPesos: tramo.hasta === Infinity ? "y más" : tramo.hasta * mesInfo.utm,
        rebajaPesos: tramo.rebaja * mesInfo.utm
      };
    });
  }, [mesInfo.utm]);

  return (
    <div className="ref-panel">
      <Card className="card">
        <h4 className="card-title">
          Tabla Impuesto Único ({mesInfo.nombre})
        </h4>

        <div className="ref-table-container">
          <table className="ref-table">
            <thead>
              <tr>
                <th className="ref-header-cell">Desde</th>
                <th className="ref-header-cell">Hasta</th>
                <th className="ref-header-cell">Factor</th>
                <th className="ref-header-cell">Rebaja</th>
              </tr>
            </thead>
            <tbody>
              {tablaImpuestosPesos.map((tramo, index) => (
                <tr key={index}>
                  <td className="ref-cell ref-cell-right">
                    {formatearMoneda(tramo.desdePesos)}
                  </td>
                  <td className="ref-cell ref-cell-right">
                    {typeof tramo.hastaPesos === 'string' ? tramo.hastaPesos : formatearMoneda(tramo.hastaPesos)}
                  </td>
                  <td className="ref-cell ref-cell-center">
                    {formatearFactor(tramo.factor)}
                  </td>
                  <td className="ref-cell ref-cell-right">
                    {formatearMoneda(tramo.rebajaPesos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="card-title" style={{ marginTop: '20px' }}>
          Información AFP
        </h4>

        <div className="ref-table-container">
          <table className="ref-table">
            <thead>
              <tr>
                <th className="ref-header-cell">AFP</th>
                <th className="ref-header-cell">Comisión</th>
                <th className="ref-header-cell">SIS</th>
              </tr>
            </thead>
            <tbody>
              {baseDatos.afp.map((afp) => (
                <tr key={afp.id}>
                  <td className="ref-cell">{afp.nombre}</td>
                  <td className="ref-cell ref-cell-center">{formatearFactor(afp.comision / 100)}</td>
                  <td className="ref-cell ref-cell-center">{formatearFactor(afp.sis / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
          Valores calculados con UTM de {formatearMoneda(mesInfo.utm)} ({mesInfo.nombre} 2025)
          <br />
          UF: {formatearMoneda(baseDatos.parametros.uf)}
        </div>

        <div style={{ fontSize: '12px', color: '#666', marginTop: '15px', padding: '10px', backgroundColor: 'var(--info-box-bg)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Topes Imponibles:</div>
          <div>Previsional: {formatearMoneda(baseDatos.parametros.topeImponible.general * baseDatos.parametros.uf)}</div>
          <div>IUT: {formatearMoneda(baseDatos.parametros.topeImponible.iut * mesInfo.utm)}</div>
          <div>Seguro Cesantía: {formatearMoneda(baseDatos.parametros.topeImponible.seguroCesantia * baseDatos.parametros.uf)}</div>
        </div>
      </Card>
    </div>
  );
}

// Componente para la Base de Datos - memoizado
const BaseDatosComponent = React.memo(function BaseDatosComponent({ state, updateState }) {
  const [activeTab, setActiveTab] = useState("afp");

  // Formateo para porcentajes - memoizado
  const formatearPorcentaje = useCallback((valor) => {
    return valor.toFixed(2) + "%";
  }, []);

  // Formateo para mostrar moneda - memoizado
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  return (
    <div className="db-section">
      <h3 className="card-title">Base de Datos de Previsión</h3>

      <div className="db-tabs">
        <div
          className={`db-tab ${activeTab === "afp" ? "db-tab-active" : ""}`}
          onClick={() => setActiveTab("afp")}
        >
          AFP
        </div>
        <div
          className={`db-tab ${activeTab === "salud" ? "db-tab-active" : ""}`}
          onClick={() => setActiveTab("salud")}
        >
          Salud
        </div>
        <div
          className={`db-tab ${activeTab === "utm" ? "db-tab-active" : ""}`}
          onClick={() => setActiveTab("utm")}
        >
          UTM
        </div>
        <div
          className={`db-tab ${activeTab === "parametros" ? "db-tab-active" : ""}`}
          onClick={() => setActiveTab("parametros")}
        >
          Parámetros
        </div>
      </div>

      {activeTab === "afp" && (
        <div className="db-content">
          <table className="db-table">
            <thead>
              <tr>
                <th>AFP</th>
                <th>Comisión</th>
                <th>SIS</th>
                <th>Total Dcto.</th>
              </tr>
            </thead>
            <tbody>
              {baseDatos.afp.map(afp => (
                <tr key={afp.id}>
                  <td>{afp.nombre}</td>
                  <td>{formatearPorcentaje(afp.comision)}</td>
                  <td>{formatearPorcentaje(afp.sis)}</td>
                  <td>{formatearPorcentaje(10 + afp.comision + afp.sis)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "salud" && (
        <div className="db-content">
          <table className="db-table">
            <thead>
              <tr>
                <th>Institución</th>
                <th>Tipo</th>
                <th>Cotización</th>
                <th>Adicional</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {baseDatos.salud.map(salud => (
                <tr key={salud.id}>
                  <td>{salud.nombre}</td>
                  <td>{salud.tipo === "isapre" ? "ISAPRE" : "FONASA"}</td>
                  <td>{formatearPorcentaje(salud.cotizacion)}</td>
                  <td>{salud.tipo === "isapre" ? formatearMoneda(salud.adicional * baseDatos.parametros.uf) + " UF" : "N/A"}</td>
                  <td>{salud.tipo === "isapre" ? "Variable" : formatearPorcentaje(salud.cotizacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "utm" && (
        <div className="db-content">
          <table className="db-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Valor UTM</th>
              </tr>
            </thead>
            <tbody>
              {baseDatos.meses.map(mes => (
                <tr key={mes.id}>
                  <td>{mes.nombre}</td>
                  <td>{formatearMoneda(mes.utm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "parametros" && (
        <div className="db-content">
          <table className="db-table">
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>UF</td>
                <td>{formatearMoneda(baseDatos.parametros.uf)}</td>
              </tr>
              <tr>
                <td>Tope Imponible General</td>
                <td>{baseDatos.parametros.topeImponible.general} UF ({formatearMoneda(baseDatos.parametros.topeImponible.general * baseDatos.parametros.uf)})</td>
              </tr>
              <tr>
                <td>Tope Imponible IUT</td>
                <td>{baseDatos.parametros.topeImponible.iut} UTM</td>
              </tr>
              <tr>
                <td>Tope Seguro Cesantía</td>
                <td>{baseDatos.parametros.topeImponible.seguroCesantia} UF</td>
              </tr>
              <tr>
                <td>Seguro Cesantía (indefinido)</td>
                <td>Trabajador: {formatearPorcentaje(baseDatos.parametros.seguroCesantia.trabajador.indefinido)}, Empleador: {formatearPorcentaje(baseDatos.parametros.seguroCesantia.empleador.indefinido)}</td>
              </tr>
              <tr>
                <td>Seguro Cesantía (plazo fijo)</td>
                <td>Trabajador: {formatearPorcentaje(baseDatos.parametros.seguroCesantia.trabajador.plazoFijo)}, Empleador: {formatearPorcentaje(baseDatos.parametros.seguroCesantia.empleador.plazoFijo)}</td>
              </tr>
              <tr>
                <td>SIS (Seguro de Invalidez y Sobrevivencia)</td>
                <td>1,38% (paga el empleador)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// Componente principal para la calculadora de sueldos
export function SueldoCalculator({ state, updateState }) {
  // Extraer estados del estado global
  const {
    etiqueta,
    mostrarTablaReferencia,
    mostrarModoAvanzado,
    mostrarBaseDatos,
    mostrarCalculoInverso,
    calculosRealizados,
    error,
    haberesImponibles,
    haberesNoImponibles,
    otrosDescuentos,
    afpSeleccionada,
    saludSeleccionada,
    tipoContrato,
    mesActual,
    descuentosCalculados,
    calculoImpuesto,
    totalOtrosDescuentos,
    tipoIndustria,
    mutualPersonalizado,
    mostrarMutualPersonalizado
  } = state;

  // Función para actualizar un estado específico - memoizada
  const updateStateValue = useCallback((key, value) => {
    updateState({ [key]: value });
  }, [updateState]);

  // Formateo para mostrar moneda - memoizado
  const formatearMoneda = useCallback((valor) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(valor);
  }, []);

  // Obtener información del mes seleccionado - memoizado
  const mesInfo = useMemo(() => {
    return baseDatos.meses.find(m => m.id === parseInt(mesActual)) || baseDatos.meses[2]; // Default a marzo
  }, [mesActual]);

  // Calcular total de haberes imponibles - memoizado
  const totalHaberesImponibles = useMemo(() => {
    return Object.entries(haberesImponibles).reduce((sum, [key, valor]) => {
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [haberesImponibles]);

  // Calcular total de haberes no imponibles - memoizado
  const totalHaberesNoImponibles = useMemo(() => {
    return Object.entries(haberesNoImponibles).reduce((sum, [key, valor]) => {
      const valorNumerico = parseInt(valor.toString().replace(/\D/g, "")) || 0;
      return sum + valorNumerico;
    }, 0);
  }, [haberesNoImponibles]);

  // Calcular impuesto único al trabajo (IUT) - memoizado
  // Calcular impuesto único al trabajo (IUT) - memoizado
  const impuestoUnico = useMemo(() => {
    // Si no hay descuentos calculados o haberes imponibles, retornar 0
    if (!descuentosCalculados || totalHaberesImponibles === 0) {
      return {
        baseImponible: 0,
        baseImponibleUTM: 0,
        tramo: null,
        impuesto: 0
      };
    }

    // Base imponible = Total Haberes Imponibles - Descuentos Previsionales
    // Como ahora descuentosCalculados.totalDescuentos ya no incluye SIS, el cálculo es correcto
    const baseImponible = Math.max(0, totalHaberesImponibles - descuentosCalculados.totalDescuentos);

    // Convertir a UTM
    const baseImponibleUTM = baseImponible / mesInfo.utm;

    // Tope imponible UTM
    const topeImponibleUTM = baseDatos.parametros.topeImponible.iut;

    // Aplicar tope
    const baseImponibleConTope = Math.min(baseImponibleUTM, topeImponibleUTM);

    // Encontrar tramo correspondiente
    const tramo = baseDatos.iut.find(
      t => baseImponibleConTope > t.desde && baseImponibleConTope <= t.hasta
    ) || baseDatos.iut[0];

    // Calcular impuesto según fórmula: (Base Imponible/UTM * Factor - Rebaja) * UTM
    let impuesto = ((baseImponibleConTope * tramo.factor) - tramo.rebaja) * mesInfo.utm;

    // Si es negativo o muy pequeño, considerar 0
    impuesto = impuesto < 10 ? 0 : impuesto;

    return {
      baseImponible,
      baseImponibleUTM: baseImponibleConTope,
      tramo,
      impuesto
    };
  }, [
    descuentosCalculados,
    totalHaberesImponibles,
    mesInfo.utm
  ]);

  // Calcular sueldo líquido - memoizado
  const sueldoLiquido = useMemo(() => {
    // Si no hay datos suficientes, retornar 0
    if (totalHaberesImponibles === 0 || !descuentosCalculados) {
      return 0;
    }

    // Fórmula: (Haberes Imponibles + Haberes NO Imponibles) - (Descuentos Previsionales + Impuesto + Otros descuentos)
    // Los descuentosCalculados.totalDescuentos ya no incluyen SIS, así que es correcto
    const totalHaberes = totalHaberesImponibles + totalHaberesNoImponibles;
    const totalDescuentos = descuentosCalculados.totalDescuentos + impuestoUnico.impuesto + (totalOtrosDescuentos || 0);

    return totalHaberes - totalDescuentos;
  }, [
    totalHaberesImponibles,
    totalHaberesNoImponibles,
    descuentosCalculados,
    impuestoUnico.impuesto,
    totalOtrosDescuentos
  ]);

  // Actualizar el cálculo de impuesto en el estado global - con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateState({ calculoImpuesto: impuestoUnico });
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [impuestoUnico, updateState]);

  // Calcular gastos para el empleador - memoizado
  const gastosEmpleador = useMemo(() => {
    const totalImponible = totalHaberesImponibles;

    // Si no hay haberes imponibles, retornar solo los haberes
    if (totalImponible === 0) {
      return {
        totalImponible,
        seguroCesantiaEmpleador: 0,
        sisEmpleador: 0,
        mutualSeguridad: 0,
        industria: null,
        totalGastos: totalImponible + totalHaberesNoImponibles
      };
    }

    // Base imponible con tope para seguro cesantía
    const topeImponiblePesos = baseDatos.parametros.topeImponible.seguroCesantia * baseDatos.parametros.uf;
    const baseImponibleConTope = Math.min(totalImponible, topeImponiblePesos);

    // Seguro de cesantía (parte del empleador)
    const porcentajeSeguroCesantia = tipoContrato === "indefinido"
      ? baseDatos.parametros.seguroCesantia.empleador.indefinido
      : baseDatos.parametros.seguroCesantia.empleador.plazoFijo;

    const seguroCesantiaEmpleador = baseImponibleConTope * (porcentajeSeguroCesantia / 100);

    // SIS - lo paga el empleador
    const afpInfo = baseDatos.afp.find(a => a.id === parseInt(afpSeleccionada)) || null;
    const sisEmpleador = afpInfo ? baseImponibleConTope * (afpInfo.sis / 100) : 0;

    // Mutual de Seguridad - MODIFICADO para usar la tasa base + adicional
    const industria = baseDatos.mutualSeguridad.find(i => i.id === parseInt(tipoIndustria)) || baseDatos.mutualSeguridad[0];
    // Si es personalizado, usar el valor ingresado por el usuario
    const tasaAdicional = industria.id === 10 ? parseFloat(mutualPersonalizado || 0) : industria.adicional;
    const tasaTotal = industria.tasa + tasaAdicional;
    const mutualSeguridad = baseImponibleConTope * (tasaTotal / 100);

    // Total gastos = Total Haberes + Aportes Empleador
    const totalGastos = totalImponible + totalHaberesNoImponibles +
      seguroCesantiaEmpleador + sisEmpleador + mutualSeguridad;

    return {
      totalImponible,
      seguroCesantiaEmpleador,
      sisEmpleador,
      mutualSeguridad,
      industria, // Incluimos la información de la industria
      totalGastos
    };
  }, [
    totalHaberesImponibles,
    totalHaberesNoImponibles,
    tipoContrato,
    afpSeleccionada,
    tipoIndustria,
    mutualPersonalizado // Usar la variable desestructurada
  ]);

  // Agregar un nuevo cálculo - memoizado
  const agregarCalculo = useCallback(() => {
    // Validar que existan datos mínimos
    if (totalHaberesImponibles === 0) {
      updateStateValue("error", "Debe ingresar al menos un valor en Haberes Imponibles");
      return;
    }

    if (!afpSeleccionada) {
      updateStateValue("error", "Debe seleccionar una AFP");
      return;
    }

    if (!saludSeleccionada) {
      updateStateValue("error", "Debe seleccionar un sistema de salud");
      return;
    }

    try {
      const nuevoCalculo = {
        id: Date.now(),
        etiqueta: etiqueta || `Cálculo ${calculosRealizados.length + 1}`,
        haberesImponibles: { ...haberesImponibles },
        totalHaberesImponibles: totalHaberesImponibles,
        haberesNoImponibles: { ...haberesNoImponibles },
        totalHaberesNoImponibles: totalHaberesNoImponibles,
        afp: baseDatos.afp.find(a => a.id === parseInt(afpSeleccionada))?.nombre || "",
        salud: baseDatos.salud.find(s => s.id === parseInt(saludSeleccionada))?.nombre || "",
        tipoContrato,
        descuentosPrevisionales: descuentosCalculados?.totalDescuentos || 0,
        impuesto: impuestoUnico.impuesto,
        otrosDescuentos: totalOtrosDescuentos || 0,
        sueldoLiquido,
        mes: mesInfo.nombre,
        gastosEmpleador: gastosEmpleador.totalGastos,
        fecha: new Date().toLocaleDateString()
      };

      updateStateValue("calculosRealizados", [...calculosRealizados, nuevoCalculo]);
      updateStateValue("etiqueta", "");
      updateStateValue("error", "");
    } catch (err) {
      console.error("Error al calcular:", err);
      updateStateValue("error", "Ocurrió un error al realizar el cálculo");
    }
  }, [
    totalHaberesImponibles,
    totalHaberesNoImponibles,
    afpSeleccionada,
    saludSeleccionada,
    etiqueta,
    calculosRealizados.length,
    haberesImponibles,
    haberesNoImponibles,
    tipoContrato,
    descuentosCalculados,
    impuestoUnico.impuesto,
    totalOtrosDescuentos,
    sueldoLiquido,
    mesInfo.nombre,
    gastosEmpleador.totalGastos,
    updateStateValue
  ]);

  // Eliminar un cálculo - memoizado
  const eliminarCalculo = useCallback((id) => {
    updateStateValue("calculosRealizados", calculosRealizados.filter(calculo => calculo.id !== id));
  }, [calculosRealizados, updateStateValue]);

  // Limpiar todos los cálculos - memoizado
  const limpiarCalculos = useCallback(() => {
    updateStateValue("calculosRealizados", []);
    updateStateValue("etiqueta", "");
    updateStateValue("error", "");
  }, [updateStateValue]);

  return (
    <div className="publish-container">
      <div className="header">
        <h2>Calculadora de Remuneraciones</h2>
      </div>

      <div className="options-bar">
        <div className="switch-container switch-table-ref">
          <Text style={{ fontSize: '13px' }}>Tabla de referencia</Text>
          <Switch
            checked={mostrarTablaReferencia}
            onChange={(e, data) => updateStateValue("mostrarTablaReferencia", data.checked)}
          />
        </div>

        <div className="switch-container switch-modo">
          <Text style={{ fontSize: '13px' }}>Modo avanzado</Text>
          <Switch
            checked={mostrarModoAvanzado}
            onChange={(e, data) => updateStateValue("mostrarModoAvanzado", data.checked)}
          />
        </div>

        <div className="switch-container switch-db">
          <Text style={{ fontSize: '13px' }}>Base de datos</Text>
          <Switch
            checked={mostrarBaseDatos}
            onChange={(e, data) => updateStateValue("mostrarBaseDatos", data.checked)}
          />
        </div>

        <div className="switch-container switch-inverso">
          <Text style={{ fontSize: '13px' }}>Cálculo inverso</Text>
          <Switch
            checked={mostrarCalculoInverso}
            onChange={(e, data) => updateStateValue("mostrarCalculoInverso", data.checked)}
          />
        </div>
      </div>

      <div className="layout">
        {/* Sección de configuración */}
        <div className="config-section">
          {/* Panel de cálculo inverso o panel normal de entrada de datos */}
          {mostrarCalculoInverso ? (
            <CalculoInverso
              state={state}
              updateState={updateState}
              baseDatos={baseDatos}
            />
          ) : (
            <div className="input-panel">
              <Card className="card">
                <h3 className="card-title">Cálculo de Sueldo</h3>

                <div className="fieldset">
                  <div className="legend">Datos generales</div>

                  <div className="input-container">
                    <div className="input-group">
                      <Label className="input-label" htmlFor="etiqueta" weight="semibold">Etiqueta (opcional)</Label>
                      <Input
                        id="etiqueta"
                        value={etiqueta}
                        onChange={(e) => updateStateValue("etiqueta", e.target.value)}
                        placeholder=""
                        appearance="outline"
                      />
                    </div>

                    <div className="input-group">
                      <Label className="input-label" weight="semibold">Mes de Cálculo</Label>
                      <select
                        className="dropdown"
                        value={mesActual}
                        onChange={(e) => updateStateValue("mesActual", e.target.value)}
                      >
                        {baseDatos.meses.map(mes => (
                          <option key={mes.id} value={mes.id}>
                            {mes.nombre} ({formatearMoneda(mes.utm)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="sueldo-sections">
                  <HaberesImponibles
                    state={state}
                    updateState={updateState}
                  />

                  <HaberesNoImponibles
                    state={state}
                    updateState={updateState}
                  />
                </div>

                <div className="sueldo-sections">
                  <DescuentosPrevisionales
                    state={state}
                    updateState={updateState}
                  />

                  <OtrosDescuentos
                    state={state}
                    updateState={updateState}
                  />
                </div>

                <div className="resumen-sueldo">
                  <div className="resumen-linea">
                    <span>Total Haberes Imponibles:</span>
                    <span className="valor">{formatearMoneda(totalHaberesImponibles)}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Total Haberes No Imponibles:</span>
                    <span className="valor">{formatearMoneda(totalHaberesNoImponibles)}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Total Haberes:</span>
                    <span className="valor">{formatearMoneda(totalHaberesImponibles + totalHaberesNoImponibles)}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Descuentos Previsionales:</span>
                    <span className="valor">-{formatearMoneda(descuentosCalculados?.totalDescuentos || 0)}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Detalle Previsionales:</span>
                    <span className="valor">
                      AFP: -{formatearMoneda((descuentosCalculados?.cotizacionAfpObligatoria || 0) + (descuentosCalculados?.comisionAfp || 0))},
                      Salud: -{formatearMoneda((descuentosCalculados?.cotizacionSalud || 0) + (descuentosCalculados?.cotizacionAdicionalSalud || 0))},
                      SC: -{formatearMoneda(descuentosCalculados?.seguroCesantiaTrabajador || 0)}
                      {/* SIS removido de aquí porque es costo del empleador */}
                    </span>
                  </div>
                  <div className="resumen-linea">
                  <span>Impuesto Único (IUT):</span>
                    <span className="valor">-{formatearMoneda(impuestoUnico?.impuesto || 0)}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Otros Descuentos:</span>
                    <span className="valor">-{formatearMoneda(totalOtrosDescuentos || 0)}</span>
                  </div>
                  <div className="resumen-linea resumen-total">
                    <span>SUELDO LÍQUIDO:</span>
                    <span className="valor">{formatearMoneda(sueldoLiquido)}</span>
                  </div>
                </div>

                {/* Información para el empleador - MODIFICADO para mostrar SIS como costo del empleador */}
                {mostrarModoAvanzado && (
                  <div className="fieldset" style={{ marginTop: '20px' }}>
                    <div className="legend">Información para el Empleador</div>

                    {/* Sección donde se muestra el selector de industria en SueldoCalculator */}
                    <div className="input-group" style={{ marginBottom: '15px' }}>
                      <Label className="input-label">Tipo de Industria (Mutual)</Label>
                      <select
                        className="dropdown"
                        value={tipoIndustria || "1"}
                        onChange={(e) => {
                          updateState({ tipoIndustria: e.target.value });
                          // Si se selecciona "Personalizado", mostrar campo adicional
                          if (e.target.value === "10") {
                            updateState({ mostrarMutualPersonalizado: true });
                          } else {
                            updateState({ mostrarMutualPersonalizado: false });
                          }
                        }}
                      >
                        {baseDatos.mutualSeguridad.map(industria => (
                          <option key={industria.id} value={industria.id}>
                            {industria.nombre} ({(industria.tasa + industria.adicional).toFixed(2)}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Campo para porcentaje personalizado */}
                    {mostrarMutualPersonalizado && (
                      <div className="input-group" style={{ marginBottom: '15px' }}>
                        <Label className="input-label">Porcentaje Adicional Personalizado (%)</Label>
                        <Input
                          size="small"
                          type="number"
                          min="0"
                          step="0.01"
                          value={mutualPersonalizado || "0"}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0;
                            updateState({ mutualPersonalizado: valor });
                          }}
                          appearance="outline"
                          placeholder="Ej: 1.7"
                        />
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                          El porcentaje total será: {(0.93 + parseFloat(mutualPersonalizado || 0)).toFixed(2)}%
                        </div>
                      </div>
                    )}

                    <div className="resumen-sueldo" style={{ background: 'none', border: 'none', padding: '10px 0' }}>
                      <div className="resumen-linea">
                        <span>Total Haberes:</span>
                        <span className="valor">{formatearMoneda(totalHaberesImponibles + totalHaberesNoImponibles)}</span>
                      </div>
                      <div className="resumen-linea">
                        <span>Seguro Cesantía Empleador ({tipoContrato === "indefinido" ? "2,4%" : "3,0%"}):</span>
                        <span className="valor">{formatearMoneda(gastosEmpleador.seguroCesantiaEmpleador)}</span>
                      </div>
                      <div className="resumen-linea">
                        <span>SIS Empleador (1,38%):</span>
                        <span className="valor">{formatearMoneda(gastosEmpleador.sisEmpleador)}</span>
                      </div>
                      <div className="resumen-linea">
                        <span>Mutual de Seguridad ({gastosEmpleador.industria ?
                          (gastosEmpleador.industria.id === 10 ?
                            (0.93 + parseFloat(mutualPersonalizado || 0)).toFixed(2) :
                            (gastosEmpleador.industria.tasa + gastosEmpleador.industria.adicional).toFixed(2)
                          ) : "0.93"}%):</span>
                        <span className="valor">{formatearMoneda(gastosEmpleador.mutualSeguridad)}</span>
                      </div>
                      <div className="resumen-linea resumen-total">
                        <span>COSTO TOTAL EMPRESA:</span>
                        <span className="valor">{formatearMoneda(gastosEmpleador.totalGastos)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Base de datos */}
                {mostrarBaseDatos && (
                  <BaseDatosComponent
                    state={state}
                    updateState={updateState}
                  />
                )}

                {error && <Text className="error-text">{error}</Text>}

                <div className="button-container">
                  <Button
                    appearance="primary"
                    onClick={agregarCalculo}
                    className="button"
                  >
                    Calcular
                  </Button>
                </div>

                <Button
                  appearance="transparent"
                  onClick={() => {
                    alert(`
Cómo se calcula el sueldo líquido:

1. Se suman todos los Haberes Imponibles:
   - Sueldo Base + Horas Extras + Bonos Imponibles + Comisiones + Gratificación + Semana Corrida + Bono Vacaciones
   
2. Se calculan los Descuentos Previsionales sobre la base imponible:
   - AFP: 10% Cotización Obligatoria + Comisión AFP (variable según la AFP)
   - Salud: 7% obligatorio + adicional según plan ISAPRE
   - SIS: 1,38% (Seguro de Invalidez y Sobrevivencia)
   - Seguro Cesantía: 0,6% para contratos indefinidos, 0% para contratos a plazo fijo
   - APV (si existe)

3. Se calcula el Impuesto Único de Segunda Categoría (IUT):
   - Base Imponible = Haberes Imponibles - Descuentos Previsionales
   - Fórmula: (Base Imponible/UTM * Factor - Rebaja) * UTM
   - El factor y rebaja dependen del tramo en que caiga la base imponible

4. Se suman todos los Haberes No Imponibles:
   - Colación + Movilización + Asignación Familiar + Viáticos + Sala Cuna

5. Se suman todos los Otros Descuentos:
   - Anticipos + Préstamos + Descuentos Judiciales + Cuotas Sindicales + Seguros Complementarios

6. Finalmente, el Sueldo Líquido se calcula:
   - (Haberes Imponibles + Haberes NO Imponibles) - (Descuentos Previsionales + Impuesto + Otros Descuentos)
                  `);
                  }}
                  className="info-button"
                >
                  <span style={{ fontSize: '16px' }}>ⓘ</span> ¿Cómo se calcula el sueldo?
                </Button>
              </Card>
            </div>
          )}

          {/* Panel derecho: Tabla de referencia (si está activada) */}
          {mostrarTablaReferencia && (
            <TablaReferencia
              state={state}
            />
          )}
        </div>

        {/* Sección de resultados */}
        <div className="results-section">
          <Card className="card">
            <h3 className="card-title">Cálculos Realizados</h3>

            <div className="table-container">
              {calculosRealizados.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th className="table-header">Etiqueta</th>
                      <th className="table-header">Fecha</th>
                      <th className="table-header">Total Haberes</th>
                      <th className="table-header">Previsionales</th>
                      <th className="table-header">Impuesto</th>
                      <th className="table-header">Otros Dctos.</th>
                      <th className="table-header">Sueldo Líquido</th>
                      {mostrarModoAvanzado && (
                        <th className="table-header">Costo Empresa</th>
                      )}
                      <th className="table-header">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculosRealizados.map((calculo) => (
                      <tr key={calculo.id}>
                        <td className="table-cell">{calculo.etiqueta}</td>
                        <td className="table-cell">{calculo.fecha}</td>
                        <td className="table-cell money-cell">{formatearMoneda(calculo.totalHaberesImponibles + calculo.totalHaberesNoImponibles)}</td>
                        <td className="table-cell money-cell">-{formatearMoneda(calculo.descuentosPrevisionales)}</td>
                        <td className="table-cell money-cell">-{formatearMoneda(calculo.impuesto)}</td>
                        <td className="table-cell money-cell">-{formatearMoneda(calculo.otrosDescuentos)}</td>
                        <td className="table-cell money-cell" style={{ fontWeight: 'bold' }}>{formatearMoneda(calculo.sueldoLiquido)}</td>
                        {mostrarModoAvanzado && (
                          <td className="table-cell money-cell">{formatearMoneda(calculo.gastosEmpleador)}</td>
                        )}
                        <td className="table-cell">
                          <Button
                            appearance="subtle"
                            onClick={() => eliminarCalculo(calculo.id)}
                            aria-label="Eliminar cálculo"
                            icon={<span>✕</span>}
                            style={{ minWidth: 'auto', height: '24px', padding: '0 8px' }}
                          >
                            <span style={{ fontSize: '11px' }}>Eliminar</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)' }}>
                  <Text>No hay cálculos realizados. Ingrese los datos y presione "Guardar Cálculo".</Text>
                </div>
              )}
            </div>

            {calculosRealizados.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <Button
                  appearance="outline"
                  onClick={limpiarCalculos}
                  style={{
                    borderColor: '#0078d4',
                    color: '#0078d4',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}