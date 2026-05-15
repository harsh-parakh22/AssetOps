@REM Maven wrapper for Windows
@ECHO OFF
SET MAVEN_HOME=%USERPROFILE%\.m2\wrapper
SET MVN_CMD=mvn
IF EXIST "%MAVEN_HOME%\bin\mvn.cmd" SET MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd
"%MVN_CMD%" %*
