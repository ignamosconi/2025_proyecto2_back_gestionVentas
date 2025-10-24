export enum MetodoPagoCompraEnum {
    // Pago realizado al momento de la compra
    EFECTIVO = 'Efectivo', 
    
    // Pago con tarjeta de débito o crédito
    TARJETA_DEBITO = 'Tarjeta de débito', 

    TARJETA_CREDITO = 'Tarjeta de crédito',

    
    // Pago a través de una transferencia bancaria
    TRANSFERENCIA = 'Transferencia', 
    
    // Compra registrada para ser pagada en una fecha posterior (a crédito)
    CREDITO = 'Crédito', 
    
    // Pago mediante la emisión de un cheque
    CHEQUE = 'Cheque', 
}