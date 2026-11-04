# Clase 14, EyDE 2026. Ejecutar desde esta carpeta: Rscript --vanilla analisis.R --export
# Escenarios didácticos distintos: DBCA factorial y parcelas divididas en bloques.
# Cuatro bloques fijados por el esquema solicitado; no es un cálculo de potencia.
# Medias generadoras hipotéticas; una única semilla, sin búsqueda de significación.
set.seed(202614)
n_bloques <- 4L
mu <- matrix(c(4.1,5.2,4.5,7.3),2,2)
d <- expand.grid(A=factor(c('Bajo','Alto'),levels=c('Bajo','Alto')),
                 B=factor(c('Sin','Con'),levels=c('Sin','Con')),bloque=factor(1:n_bloques))
d$posicion <- unlist(lapply(1:n_bloques,function(k) sample(1:4)))
d$parcela <- paste0('B',d$bloque,'-P',d$posicion)
u <- rnorm(n_bloques,0,.45)
d$y <- mu[cbind(as.integer(d$A),as.integer(d$B))]+u[d$bloque]+rnorm(nrow(d),0,.55)
fit <- lm(y ~ bloque + A*B,data=d)
ad <- anova(fit)
# Contrastes promediados sobre bloques; orden: Bajo/Sin, Alto/Sin, Bajo/Con, Alto/Con.
X <- model.matrix(~bloque+A*B,d)
Xmed <- do.call(rbind,lapply(1:4,function(i) colMeans(X[seq(i,16,4),,drop=FALSE])))
C <- rbind('Fertilización | riego bajo'=c(-1,0,1,0),
           'Fertilización | riego alto'=c(0,-1,0,1),
           'Interacción: alto − bajo'=c(1,-1,-1,1))
L <- C %*% Xmed
estimacion <- drop(L %*% coef(fit))
error_estandar <- sqrt(diag(L %*% vcov(fit) %*% t(L)))
gl <- df.residual(fit)
# IC individuales del 95% del mismo modelo: resultados centrales de la clase.
critico_individual <- qt(.975,gl)
p_individual <- 2*pt(-abs(estimacion/error_estandar),gl)
contrastes_individuales <- data.frame(Contraste=rownames(C),estimacion,
 inferior=estimacion-critico_individual*error_estandar,
 superior=estimacion+critico_individual*error_estandar,
 error_estandar,gl=gl,p_individual,row.names=NULL)
# Coherencia del contraste de interacción con ANOVA y con confint del coeficiente.
ci_coef <- confint(fit,'AAlto:BCon',level=.95)
stopifnot(abs(p_individual[3]-ad['A:B','Pr(>F)'])<1e-12,
 max(abs(unname(ci_coef)-unlist(contrastes_individuales[3,c('inferior','superior')])))<1e-12,
 (contrastes_individuales$inferior[3]>0)==(p_individual[3]<.05))
# Material opcional: familia planificada de tres contrastes con Bonferroni.
# No es un paso automático tras una interacción significativa.
# Se conserva la salida simultánea original para las notas docentes.
critico <- qt(1-.05/(2*nrow(C)),gl)
contrastes <- data.frame(Contraste=rownames(C),estimacion,
 inferior=estimacion-critico*error_estandar,superior=estimacion+critico*error_estandar,
 error_estandar,p_ajustada=pmin(1,3*2*pt(-abs(estimacion/error_estandar),gl)),row.names=NULL)
stopifnot(gl==9,abs((estimacion[3]/error_estandar[3])^2-ad['A:B','F value'])<1e-10)
# Escenario nuevo con errores de parcela mayor compartidos por sus dos subparcelas.
s <- d[c('A','B','bloque')]
s$mayor <- interaction(s$bloque,s$A,drop=TRUE)
orden_A <- lapply(1:4,function(k) sample(1:2))
s$pos_mayor <- unlist(lapply(1:4,function(k) rep(orden_A[[k]],2)))
s$pos_sub <- NA_integer_
for(g in levels(s$mayor)) s$pos_sub[s$mayor==g] <- sample(1:2)
u_s <- rnorm(4,0,.45); w <- rnorm(8,0,.65)
s$y <- mu[cbind(as.integer(s$A),as.integer(s$B))]+u_s[s$bloque]+w[s$mayor]+rnorm(nrow(s),0,.35)
fit_s <- aov(y ~ A*B + Error(bloque/A), data=s)
asplit <- summary(fit_s)
# SC ortogonales: verificación independiente del ANOVA con estratos.
tmp <- anova(lm(y ~ bloque + A + bloque:A + B + A:B,data=s))
orden <- c('bloque','A','bloque:A','B','A:B','Residuals')
tmp <- tmp[orden,]
gls <- tmp[['Df']]; scs <- tmp[['Sum Sq']]; cms <- scs/gls
Fs <- c(cms[1]/cms[3],cms[2]/cms[3],NA,cms[4]/cms[6],cms[5]/cms[6],NA)
ps <- c(pf(Fs[1],gls[1],gls[3],lower.tail=FALSE),pf(Fs[2],1,3,lower.tail=FALSE),NA,pf(Fs[4],1,6,lower.tail=FALSE),pf(Fs[5],1,6,lower.tail=FALSE),NA)
as_tabla <- data.frame(Fuente=c('Bloques','Riego (A)','Error parcela mayor','Fertilización (B)','A × B','Error subparcela'),gl=gls,SC=scs,CM=cms,F=Fs,p=ps)
stopifnot(identical(as.numeric(gls),c(3,1,3,1,1,6)),sum(gls)==15,
 abs(sum(scs)-sum((s$y-mean(s$y))^2))<1e-10,
 abs(Fs[2]-asplit[['Error: bloque:A']][[1]][1,'F value'])<1e-10,
 abs(Fs[4]-asplit[['Error: Within']][[1]][1,'F value'])<1e-10,
 abs(Fs[5]-asplit[['Error: Within']][[1]][2,'F value'])<1e-10,
 all(table(d$bloque,d$A,d$B)==1),all(table(s$mayor)==2))
if('--export' %in% commandArgs(TRUE)) {
 write.csv(d,'datos_dbca.csv',row.names=FALSE)
 write.csv(s,'datos_parcelas_divididas.csv',row.names=FALSE)
 write.csv(ad,'anova_dbca.csv')
 write.csv(as_tabla,'anova_parcelas_divididas.csv',row.names=FALSE)
 write.csv(contrastes,'contrastes_dbca.csv',row.names=FALSE)
 write.csv(contrastes_individuales,'contrastes_individuales_dbca.csv',row.names=FALSE)
 capture.output(sessionInfo(),file='sesion_R.txt')
 cat('Validación correcta: DBCA 9 gl residuales; parcelas divididas 3 y 6 gl.\n')
 print(ad); print(contrastes_individuales); print(as_tabla)
}
