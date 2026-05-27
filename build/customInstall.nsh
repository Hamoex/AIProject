; Custom NSIS include: Add Windows Defender exclusion before extraction
; This prevents Defender from quarantining the unsigned Electron exe

!macro installSectionHook
  ; Add install directory to Windows Defender exclusion BEFORE extracting files
  ; The installer runs as admin, so this will work
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionPath \"$INSTDIR\""'
!macroend

!macro customInstall
  ; Also exclude the specific exe (in case user changed install dir after hook)
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionProcess \"$INSTDIR\Ai Elite H.exe\""'
!macroend

!macro customUnInstall
  ; Clean up the Defender exclusions on uninstall
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-MpPreference -ExclusionPath \"$INSTDIR\""'
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-MpPreference -ExclusionProcess \"$INSTDIR\Ai Elite H.exe\""'
!macroend
